export type DifficultyType = 'Easy' | 'Moderate' | 'Hard';

export interface IQuestion {
  text: string;
  difficulty: DifficultyType;
  marks: number;
  taxonomy?: string;
  rubric?: string;
}

export interface ISection {
  title: string;
  instruction: string;
  questions: IQuestion[];
}

export interface IAnswerKeyItem {
  questionIndex: number; // 1-indexed relative to section
  sectionTitle: string;
  questionText: string;
  answer: string;
}

export interface IQuestionTypeConfig {
  type: string;
  count: number;
  marks: number;
}

export interface IAssignmentData {
  title: string;
  subject: string;
  gradeClass: string;
  schoolName: string;
  timeAllowed: number; // in minutes
  dueDate: Date;
  questionConfigs: IQuestionTypeConfig[];
  additionalInstructions?: string;
  fileUrl?: string;
  fileName?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  sections?: ISection[];
  answerKey?: IAnswerKeyItem[];
  error?: string;
}
