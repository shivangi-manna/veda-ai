import { Queue } from 'bullmq';
import { cacheConnection } from '../config/cache';
import { RegenerationVariant } from '../services/llm/types';
import logger from '../config/logger';

export const examQueue = new Queue('exam-generation', {
  connection: cacheConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true, // Keep clean
    removeOnFail: false, // Save failed jobs for dashboard analysis
  },
});

export const addExamJob = async (examId: string, variant: RegenerationVariant = 'default') => {
  try {
    const job = await examQueue.add(
      `generate-${examId}`,
      { examId, variant },
      { jobId: `${examId}-${variant}-${Date.now()}` }
    );
    logger.info(`Queued exam job ${job.id} for Exam: ${examId} with variant: ${variant}`);
    return job;
  } catch (error) {
    logger.error(`Failed to enqueue job for Exam ${examId}: ${error}`);
    throw error;
  }
};
