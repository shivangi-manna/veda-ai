import mongoose, { Schema, Document } from 'mongoose';
import { IAssignmentData, IQuestion, ISection, IAnswerKeyItem, IQuestionTypeConfig } from '../types';

export interface IAssignmentDocument extends IAssignmentData, Document {}

const QuestionSchema = new Schema<IQuestion>({
  text: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Moderate', 'Hard'], required: true },
  marks: { type: Number, required: true },
  taxonomy: { type: String },
  rubric: { type: String }
});

const SectionSchema = new Schema<ISection>({
  title: { type: String, required: true },
  instruction: { type: String, required: true },
  questions: { type: [QuestionSchema], default: [] }
});

const AnswerKeyItemSchema = new Schema<IAnswerKeyItem>({
  questionIndex: { type: Number, required: true },
  sectionTitle: { type: String, required: true },
  questionText: { type: String, required: true },
  answer: { type: String, required: true }
});

const QuestionTypeConfigSchema = new Schema<IQuestionTypeConfig>({
  type: { type: String, required: true },
  count: { type: Number, required: true, min: 1 },
  marks: { type: Number, required: true, min: 1 }
});

const AssignmentSchema = new Schema<IAssignmentDocument>(
  {
    title: { type: String, required: true },
    subject: { type: String, required: true },
    gradeClass: { type: String, required: true },
    schoolName: { type: String, required: true },
    timeAllowed: { type: Number, required: true, min: 1 },
    dueDate: { type: Date, required: true },
    questionConfigs: { type: [QuestionTypeConfigSchema], required: true },
    additionalInstructions: { type: String },
    fileUrl: { type: String },
    fileName: { type: String },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    sections: { type: [SectionSchema], default: [] },
    answerKey: { type: [AnswerKeyItemSchema], default: [] },
    error: { type: String }
  },
  { timestamps: true }
);

export const Assignment = mongoose.model<IAssignmentDocument>('Assignment', AssignmentSchema);
