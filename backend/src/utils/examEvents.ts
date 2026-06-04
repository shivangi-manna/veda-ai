import { EventEmitter } from 'events';

class ExamEventEmitter extends EventEmitter {}

export const examEvents = new ExamEventEmitter();

// Event signatures:
// 'exam:queued'    => (examId: string)
// 'exam:started'   => (examId: string, jobId: string)
// 'exam:progress'  => (examId: string, progress: number, message: string)
// 'exam:completed' => (examId: string, durationMs: number)
// 'exam:failed'    => (examId: string, errorMessage: string)

export default examEvents;
