import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { ASSIGNMENT_QUEUE_NAME } from '../queues/generationQueue';
import { Assignment } from '../models/Assignment';
import { generateAssessment } from '../services/aiService';
import { sendSocketUpdate } from '../index';
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';

const parseFile = async (filePath: string): Promise<string> => {
  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Uploaded file not found at path: ${resolvedPath}`);
  }

  const ext = path.extname(resolvedPath).toLowerCase();
  const fileBuffer = fs.readFileSync(resolvedPath);

  if (ext === '.pdf') {
    const data = await pdfParse(fileBuffer);
    return data.text || '';
  } else {
    // Treat as raw text
    return fileBuffer.toString('utf-8');
  }
};

export const initWorker = () => {
  const worker = new Worker(
    ASSIGNMENT_QUEUE_NAME,
    async (job: Job<{ assignmentId: string }>) => {
      const { assignmentId } = job.data;
      console.log(`Processing assignment job: ${assignmentId}`);

      // 1. Fetch assignment
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        throw new Error(`Assignment with ID ${assignmentId} not found`);
      }

      try {
        // Update to processing
        assignment.status = 'processing';
        await assignment.save();

        sendSocketUpdate(assignmentId, 'job:progress', {
          status: 'processing',
          progress: 10,
          message: 'Extracting content from uploaded file...'
        });

        // 2. Parse file if uploaded
        let extractedText = '';
        if (assignment.fileUrl) {
          try {
            // fileUrl points to a local file in 'uploads/'
            extractedText = await parseFile(assignment.fileUrl);
            console.log(`Extracted ${extractedText.length} characters from file.`);
          } catch (fileErr: any) {
            console.error('File parsing error:', fileErr);
            // Non-blocking, continue with empty text or throw if critical. Let's make it non-blocking but log it.
          }
        }

        sendSocketUpdate(assignmentId, 'job:progress', {
          status: 'processing',
          progress: 30,
          message: 'Parsing complete. Formatting prompt context...'
        });

        // 3. Call AI service
        sendSocketUpdate(assignmentId, 'job:progress', {
          status: 'processing',
          progress: 40,
          message: 'Querying DeepSeek AI to generate structured questions...'
        });

        const generatedData = await generateAssessment({
          title: assignment.title,
          subject: assignment.subject,
          gradeClass: assignment.gradeClass,
          schoolName: assignment.schoolName,
          questionConfigs: assignment.questionConfigs,
          additionalInstructions: assignment.additionalInstructions,
          extractedFileText: extractedText || undefined
        });

        sendSocketUpdate(assignmentId, 'job:progress', {
          status: 'processing',
          progress: 80,
          message: 'Validating generated response and structuring database...'
        });

        // 4. Save results
        assignment.sections = generatedData.sections;
        assignment.answerKey = generatedData.answerKey;
        assignment.status = 'completed';
        await assignment.save();

        sendSocketUpdate(assignmentId, 'job:progress', {
          status: 'completed',
          progress: 100,
          message: 'Paper successfully generated and saved!'
        });

        sendSocketUpdate(assignmentId, 'job:completed', {
          assignmentId: assignment._id,
          assignment
        });

        console.log(`Successfully completed assignment job: ${assignmentId}`);
      } catch (err: any) {
        console.error(`Error in worker processing job:`, err);
        assignment.status = 'failed';
        assignment.error = err.message || 'Unknown processing error';
        await assignment.save();

        sendSocketUpdate(assignmentId, 'job:failed', {
          error: assignment.error
        });

        throw err;
      }
    },
    {
      connection: redisConnection,
      concurrency: 1 // process one assignment paper at a time
    }
  );

  worker.on('active', (job) => {
    console.log(`Worker active for job: ${job.id}`);
  });

  worker.on('completed', (job) => {
    console.log(`Worker completed job: ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Worker failed job: ${job?.id} - error: ${err.message}`);
  });

  return worker;
};
