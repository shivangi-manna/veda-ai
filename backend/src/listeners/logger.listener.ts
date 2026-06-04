import examEvents from '../utils/examEvents';
import logger from '../config/logger';

export const initLoggerListener = () => {
  examEvents.on('exam:queued', (examId: string) => {
    logger.info(`Event [exam:queued] - Exam ID: ${examId}`);
  });

  examEvents.on('exam:started', (examId: string, jobId: string) => {
    logger.info(`Event [exam:started] - Exam ID: ${examId}, Job ID: ${jobId}`);
  });

  examEvents.on('exam:progress', (examId: string, progress: number, message: string) => {
    logger.debug(`Event [exam:progress] - Exam ID: ${examId}, Progress: ${progress}%, Msg: ${message}`);
  });

  examEvents.on('exam:completed', (examId: string, durationMs: number) => {
    logger.info(`Event [exam:completed] - Exam ID: ${examId}, Completed in ${durationMs}ms`);
  });

  examEvents.on('exam:failed', (examId: string, errorMessage: string) => {
    logger.error(`Event [exam:failed] - Exam ID: ${examId}, Error: ${errorMessage}`);
  });
};
