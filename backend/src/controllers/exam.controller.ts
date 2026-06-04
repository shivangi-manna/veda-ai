import { Request, Response } from 'express';
import pdfParse from 'pdf-parse';
import { Exam } from '../models/Exam';
import { addExamJob, examQueue } from '../queues/examQueue';
import { exportService } from '../services/export.service';
import { cacheConnection } from '../config/cache';
import examEvents from '../utils/examEvents';
import logger from '../config/logger';

const CACHE_TTL = 3600; // 1 hour in seconds
const getCacheKey = (id: string) => `exam:${id}`;

export class ExamController {
  // 1. Create exam and queue AI job
  createExam = async (req: Request, res: Response): Promise<void> => {
    try {
      const { title, dueDate, questionTypes, totalQuestions, marks, difficulty, instructions } = req.body;
      
      let parsedText = '';
      let fileMeta = undefined;

      if (req.file) {
        logger.info(`Extracting text from uploaded file: ${req.file.originalname} (${req.file.mimetype})`);
        try {
          if (req.file.mimetype === 'application/pdf') {
            // Safe parsing with 25 pages max limit and 15 seconds timeout
            const parsePdfWithTimeout = (buffer: Buffer, timeoutMs: number = 15000): Promise<any> => {
              return Promise.race([
                pdfParse(buffer, { max: 25 }),
                new Promise((_, reject) =>
                  setTimeout(() => reject(new Error('PDF parsing timed out. The file may be too complex or large.')), timeoutMs)
                )
              ]);
            };
            const data = await parsePdfWithTimeout(req.file.buffer);
            parsedText = data.text;
          } else {
            parsedText = req.file.buffer.toString('utf-8');
          }
          
          const sanitizedFilename = req.file.originalname
            .replace(/[^a-zA-Z0-9.\-_]/g, '_')
            .replace(/\.\.+/g, '.');

          fileMeta = {
            filename: sanitizedFilename,
            path: 'memory_buffer', // stored in database parsedText
            mimetype: req.file.mimetype,
            parsedText: parsedText,
          };
          logger.info(`Text extraction successful. Total characters: ${parsedText.length}`);
        } catch (fileErr: any) {
          logger.error(`Failed to parse file upload: ${fileErr.message || fileErr}`);
          res.status(400).json({ 
            success: false, 
            message: fileErr.message && fileErr.message.includes('timed out') 
              ? 'PDF parsing timed out. Please upload a shorter or less complex file.' 
              : 'Failed to process uploaded file. Please make sure the PDF is not corrupted.' 
          });
          return;
        }
      }

      // Save as queued in MongoDB
      const exam = new Exam({
        title,
        dueDate: new Date(dueDate),
        questionTypes,
        totalQuestions: Number(totalQuestions),
        marks: Number(marks),
        difficulty,
        instructions,
        uploadedFile: fileMeta,
        status: 'queued',
      });

      await exam.save();
      logger.info(`Saved Exam schema: ${exam._id}`);

      // Emit event
      examEvents.emit('exam:queued', exam._id.toString());

      // Queue BullMQ job
      await addExamJob(exam._id.toString(), 'default');

      res.status(201).json({
        success: true,
        message: 'Exam created and enqueued for generation',
        data: exam,
      });
    } catch (error: any) {
      logger.error(`Create exam error: ${error.message || error}`);
      res.status(500).json({ success: false, message: 'Internal server error creating exam' });
    }
  };

  // 2. Get list of exams with search/filter
  getExams = async (req: Request, res: Response): Promise<void> => {
    try {
      const { search, status } = req.query;
      const query: any = {};

      if (search) {
        query.$text = { $search: search as string };
      }

      if (status) {
        query.status = status as string;
      }

      const exams = await Exam.find(query)
        .select('-uploadedFile.parsedText') // Exclude heavy text payload for lists
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: exams,
      });
    } catch (error: any) {
      logger.error(`Get exams error: ${error.message || error}`);
      res.status(500).json({ success: false, message: 'Internal server error fetching exams' });
    }
  };

  // 3. Get exam by ID (uses Cache)
  getExamById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const cacheKey = getCacheKey(id);

      // Try reading from cache
      try {
        const cachedData = await cacheConnection.get(cacheKey);
        if (cachedData) {
          logger.debug(`Cache hit for Exam: ${id}`);
          res.status(200).json({
            success: true,
            data: JSON.parse(cachedData),
            cached: true,
          });
          return;
        }
      } catch (cacheErr) {
        logger.warn(`Cache get failed: ${cacheErr}`);
      }

      const exam = await Exam.findById(id);
      if (!exam) {
        res.status(404).json({ success: false, message: 'Exam not found' });
        return;
      }

      // If completed, save into Cache
      if (exam.status === 'completed') {
        try {
          await cacheConnection.setex(cacheKey, CACHE_TTL, JSON.stringify(exam));
          logger.debug(`Cached Exam: ${id} in Cache`);
        } catch (cacheErr) {
          logger.warn(`Cache set failed: ${cacheErr}`);
        }
      }

      res.status(200).json({
        success: true,
        data: exam,
      });
    } catch (error: any) {
      logger.error(`Get exam by ID error: ${error.message || error}`);
      res.status(500).json({ success: false, message: 'Internal server error fetching exam details' });
    }
  };

  // 4. Delete exam, clean up BullMQ queue, and invalidate cache
  deleteExam = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const exam = await Exam.findByIdAndDelete(id);
      if (!exam) {
        res.status(404).json({ success: false, message: 'Exam not found' });
        return;
      }

      // Invalidate Cache
      try {
        await cacheConnection.del(getCacheKey(id));
        logger.info(`Invalidated cache for Exam: ${id}`);
      } catch (cacheErr) {
        logger.warn(`Cache invalidation failed: ${cacheErr}`);
      }

      // Scan and remove BullMQ jobs
      try {
        const statuses: ('active' | 'waiting' | 'delayed' | 'failed' | 'paused' | 'completed')[] = ['active', 'waiting', 'delayed', 'failed', 'paused'];
        const jobs = await examQueue.getJobs(statuses);
        
        for (const job of jobs) {
          if (job.data?.examId === id) {
            logger.info(`Removing job ${job.id} from queue for deleted Exam: ${id}`);
            await job.remove();
          }
        }
      } catch (queueErr) {
        logger.error(`Failed to remove job from BullMQ queue during delete: ${queueErr}`);
      }

      res.status(200).json({
        success: true,
        message: 'Exam deleted successfully',
      });
    } catch (error: any) {
      logger.error(`Delete exam error: ${error.message || error}`);
      res.status(500).json({ success: false, message: 'Internal server error deleting exam' });
    }
  };

  // 4b. Cancel exam generation
  cancelExam = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const exam = await Exam.findById(id);
      if (!exam) {
        res.status(404).json({ success: false, message: 'Exam not found' });
        return;
      }

      if (exam.status === 'completed') {
        res.status(400).json({ success: false, message: 'Cannot cancel a completed exam' });
        return;
      }

      // Update Mongo status to cancelled
      exam.status = 'cancelled';
      exam.errorMessage = undefined;
      await exam.save();

      // Invalidate Cache
      try {
        await cacheConnection.del(getCacheKey(id));
      } catch (cacheErr) {
        logger.warn(`Cache invalidation failed during cancel: ${cacheErr}`);
      }

      // Scan and remove BullMQ jobs
      try {
        const statuses: ('active' | 'waiting' | 'delayed' | 'failed' | 'paused' | 'completed')[] = ['active', 'waiting', 'delayed', 'failed', 'paused'];
        const jobs = await examQueue.getJobs(statuses);
        
        for (const job of jobs) {
          if (job.data?.examId === id) {
            logger.info(`Removing job ${job.id} from queue for Exam: ${id}`);
            await job.remove();
          }
        }
      } catch (queueErr) {
        logger.error(`Failed to remove job from BullMQ queue: ${queueErr}`);
      }

      // Emit event
      examEvents.emit('exam:cancelled', id);

      res.status(200).json({
        success: true,
        message: 'Exam generation cancelled successfully',
        data: exam,
      });
    } catch (error: any) {
      logger.error(`Cancel exam error: ${error.message || error}`);
      res.status(500).json({ success: false, message: 'Internal server error cancelling exam' });
    }
  };

  // 5. Trigger AI regeneration with custom variant
  regenerateExam = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { variant = 'default' } = req.query;

      const exam = await Exam.findById(id);
      if (!exam) {
        res.status(404).json({ success: false, message: 'Exam not found' });
        return;
      }

      // Update status to queued
      exam.status = 'queued';
      exam.errorMessage = undefined;
      await exam.save();

      // Invalidate cache
      try {
        await cacheConnection.del(getCacheKey(id));
      } catch (cacheErr) {
        logger.warn(`Cache invalidation failed: ${cacheErr}`);
      }

      // Emit event
      examEvents.emit('exam:queued', id);

      // Enqueue job with custom variant
      await addExamJob(id, variant as any);

      res.status(200).json({
        success: true,
        message: `Regeneration enqueued with variant: ${variant}`,
        data: exam,
      });
    } catch (error: any) {
      logger.error(`Regenerate exam error: ${error.message || error}`);
      res.status(500).json({ success: false, message: 'Internal server error queueing regeneration' });
    }
  };

  // 6. Generate and download PDF stream
  downloadPDF = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const exam = await Exam.findById(id);

      if (!exam) {
        res.status(404).json({ success: false, message: 'Exam not found' });
        return;
      }

      if (exam.status !== 'completed' || !exam.generatedPaper) {
        res.status(400).json({
          success: false,
          message: `Assessment is not generated yet. Current status: ${exam.status}`,
        });
        return;
      }

      const pdfBuffer = await exportService.generateExamPDF(exam);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="assessify-exam-${exam.title.toLowerCase().replace(/\s+/g, '-')}.pdf"`
      );
      res.setHeader('Content-Length', pdfBuffer.length);
      
      res.send(pdfBuffer);
    } catch (error: any) {
      logger.error(`Download PDF error: ${error.message || error}`);
      res.status(500).json({ success: false, message: 'Internal server error generating PDF' });
    }
  };
}

export const examController = new ExamController();
export default examController;
