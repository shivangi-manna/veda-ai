import { Worker, Job } from 'bullmq';
import { cacheConnection } from '../config/cache';
import { Exam } from '../models/Exam';
import llmService from '../services/llm/llm.service';
import chunkingService from '../services/chunking.service';
import examEvents from '../utils/examEvents';
import logger from '../config/logger';

export const startExamWorker = () => {
  const worker = new Worker(
    'exam-generation',
    async (job: Job) => {
      const { examId, variant } = job.data;
      const startTime = Date.now();

      logger.info(`Starting execution of job ${job.id} for Exam: ${examId}`);
      examEvents.emit('exam:started', examId, job.id || '');

      // 1. Fetch exam details
      const exam = await Exam.findById(examId);
      if (!exam) {
        throw new Error(`Exam not found: ${examId}`);
      }
      if (exam.status === 'cancelled') {
        logger.info(`Aborting job ${job.id} for Exam: ${examId} at startup because it was cancelled.`);
        return { success: false, reason: 'cancelled' };
      }

      // 2. Prepare Reference Material with optional Chunking
      let referenceText = '';
      let syllabusSummary: { course: string; topics: string[] } | undefined = undefined;
      if (exam.uploadedFile?.parsedText) {
        examEvents.emit('exam:progress', examId, 20, 'Processing syllabus reference material');
        const query = `${exam.title} ${exam.instructions || ''}`;
        referenceText = await chunkingService.processText(exam.uploadedFile.parsedText, query);
        
        try {
          examEvents.emit('exam:progress', examId, 25, 'Extracting syllabus topics');
          syllabusSummary = await llmService.extractSyllabusSummary(exam.uploadedFile.parsedText);
        } catch (err: any) {
          logger.warn(`[Worker] Syllabus summary extraction failed: ${err.message}`);
        }
        
        examEvents.emit('exam:progress', examId, 35, 'Syllabus reference material prepared');
      }

      // Check cancellation state again
      const currentExam = await Exam.findById(examId);
      if (!currentExam || currentExam.status === 'cancelled') {
        logger.info(`Aborting job ${job.id} for Exam: ${examId} before AI synthesis because it was cancelled.`);
        return { success: false, reason: 'cancelled' };
      }

      // 3. Dispatch to AI orchestrator
      examEvents.emit('exam:progress', examId, 45, 'Synthesizing exam questions');
      
      const generatedPaper = await llmService.generateAssessment({
        title: exam.title,
        questionTypes: exam.questionTypes,
        totalQuestions: exam.totalQuestions,
        marks: exam.marks,
        difficulty: exam.difficulty,
        instructions: exam.instructions,
        referenceText: referenceText || undefined,
        variant: variant,
        syllabusSummary: syllabusSummary,
      });

      // 4. Strict Validation
      let totalQuestions = 0;
      let totalMarks = 0;
      if (generatedPaper && generatedPaper.sections) {
        for (const sec of generatedPaper.sections) {
          totalQuestions += sec.questions.length;
          for (const q of sec.questions) {
            totalMarks += q.marks;
          }
        }
      }

      const roundedTotalMarks = Math.round(totalMarks * 100) / 100;
      const expectedMarks = Math.round(exam.marks * 100) / 100;

      if (totalQuestions !== exam.totalQuestions || roundedTotalMarks !== expectedMarks) {
        throw new Error(
          `Strict validation mismatch before saving to database: generated ${totalQuestions} questions and ${roundedTotalMarks} marks, expected ${exam.totalQuestions} questions and ${expectedMarks} marks.`
        );
      }

      // Double check cancellation state to avoid race condition
      const checkExam = await Exam.findById(examId);
      if (!checkExam || checkExam.status === 'cancelled') {
        logger.info(`Aborting job ${job.id} for Exam: ${examId} before saving because it was cancelled.`);
        return { success: false, reason: 'cancelled' };
      }

      // 5. Persistence
      examEvents.emit('exam:progress', examId, 85, 'Formatting exam details');
      
      checkExam.generatedPaper = generatedPaper as any;
      checkExam.status = 'completed';
      await checkExam.save();

      // Invalidate cache after completion
      try {
        await cacheConnection.del(`exam:${examId}`);
        logger.info(`[Worker] Invalidated Cache for exam ${examId} after completion`);
      } catch (cacheErr) {
        logger.warn(`[Worker] Failed to invalidate Cache for exam ${examId}: ${cacheErr}`);
      }

      const duration = Date.now() - startTime;
      examEvents.emit('exam:completed', examId, duration);
      logger.info(`Successfully completed generation of Exam: ${examId} in ${duration}ms`);
      return { success: true, duration };
    },
    {
      connection: cacheConnection,
      concurrency: 2, // Process up to 2 exams in parallel
    }
  );

  worker.on('failed', async (job: Job | undefined, err: Error) => {
    if (job) {
      const { examId } = job.data;
      logger.error(`Job ${job.id} failed: ${err.message}`);
      
      try {
        const exam = await Exam.findById(examId);
        if (exam && exam.status === 'cancelled') {
          logger.info(`Job ${job.id} failed but exam was cancelled. Keeping cancelled status.`);
          return;
        }

        examEvents.emit('exam:failed', examId, err.message);
        
        await Exam.findByIdAndUpdate(examId, {
          status: 'failed',
          errorMessage: err.message
        });

        // Invalidate cache on failure
        await cacheConnection.del(`exam:${examId}`);
        logger.info(`[Worker] Invalidated Cache for exam ${examId} after failure`);
      } catch (dbErr: any) {
        logger.error(`Failed to update Exam ${examId} to failed status or invalidate cache: ${dbErr.message}`);
      }
    }
  });

  worker.on('error', (err) => {
    logger.error(`BullMQ worker general error: ${err.message}`);
  });

  logger.info('BullMQ worker service initialized');
  return worker;
};
