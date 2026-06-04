import examEvents from '../utils/examEvents';
import { socketGateway } from '../sockets/socket.gateway';

export const initSocketListener = () => {
  examEvents.on('exam:queued', (examId: string) => {
    socketGateway.emitToExam(examId, 'status', {
      status: 'queued',
      progress: 0,
      message: 'Queued in generation pool',
    });
  });

  examEvents.on('exam:started', (examId: string) => {
    socketGateway.emitToExam(examId, 'status', {
      status: 'processing',
      progress: 10,
      message: 'Reading reference material',
    });
  });

  examEvents.on('exam:progress', (examId: string, progress: number, message: string) => {
    socketGateway.emitToExam(examId, 'status', {
      status: progress >= 40 ? 'generating' : 'processing',
      progress,
      message,
    });
  });

  examEvents.on('exam:completed', (examId: string, durationMs: number) => {
    socketGateway.emitToExam(examId, 'status', {
      status: 'completed',
      progress: 100,
      message: 'Exam paper generated successfully!',
      durationMs,
    });
  });

  examEvents.on('exam:failed', (examId: string, errorMessage: string) => {
    socketGateway.emitToExam(examId, 'status', {
      status: 'failed',
      progress: 100,
      message: errorMessage,
    });
  });
};
