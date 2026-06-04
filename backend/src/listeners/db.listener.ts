import examEvents from '../utils/examEvents';
import { Exam } from '../models/Exam';
import logger from '../config/logger';

export const initDbListener = () => {
  examEvents.on('exam:queued', async (examId: string) => {
    try {
      await Exam.findByIdAndUpdate(examId, {
        status: 'queued',
        errorMessage: null,
      });
    } catch (err) {
      logger.error(`DbListener error on queued: ${err}`);
    }
  });

  examEvents.on('exam:started', async (examId: string, jobId: string) => {
    try {
      await Exam.findByIdAndUpdate(examId, {
        status: 'processing',
        jobId,
        startedAt: new Date(),
        errorMessage: null,
      });
    } catch (err) {
      logger.error(`DbListener error on started: ${err}`);
    }
  });

  examEvents.on('exam:progress', async (examId: string, progress: number) => {
    try {
      // If progress is advanced, set status to generating questions
      if (progress >= 40) {
        await Exam.findByIdAndUpdate(examId, {
          status: 'generating',
        });
      }
    } catch (err) {
      logger.error(`DbListener error on progress: ${err}`);
    }
  });

  examEvents.on('exam:completed', async (examId: string, durationMs: number) => {
    try {
      await Exam.findByIdAndUpdate(examId, {
        status: 'completed',
        completedAt: new Date(),
        processingDurationMs: durationMs,
        errorMessage: null,
      });
    } catch (err) {
      logger.error(`DbListener error on completed: ${err}`);
    }
  });

  examEvents.on('exam:failed', async (examId: string, errorMessage: string) => {
    try {
      const exam = await Exam.findById(examId);
      const start = exam?.startedAt || exam?.createdAt || new Date();
      const duration = Date.now() - start.getTime();

      await Exam.findByIdAndUpdate(examId, {
        status: 'failed',
        completedAt: new Date(),
        processingDurationMs: duration,
        errorMessage: errorMessage,
      });
    } catch (err) {
      logger.error(`DbListener error on failed: ${err}`);
    }
  });
};
