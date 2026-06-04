import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';

export const ASSIGNMENT_QUEUE_NAME = 'question-generation';

export const generationQueue = new Queue(ASSIGNMENT_QUEUE_NAME, {
  connection: redisConnection
});

export const addGenerationJob = async (assignmentId: string) => {
  return await generationQueue.add(
    'generate-questions-job',
    { assignmentId },
    {
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 5000
      },
      removeOnComplete: true,
      removeOnFail: false
    }
  );
};
