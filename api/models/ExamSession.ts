import mongoose, { Schema, Document } from 'mongoose';

export interface IExamSession extends Document {
  date: string;
  startTime: string;
  endTime: string;
  type: 'PE' | 'FE';
  subjectId: string;
  term: 'Spring26' | 'Summer26' | 'Fall26';
  campus: string;
  studentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ExamSessionSchema = new Schema<IExamSession>(
  {
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    type: { type: String, enum: ['PE', 'FE'], required: true },
    subjectId: { type: String, required: true },
    term: { type: String, enum: ['Spring26', 'Summer26', 'Fall26'], required: true },
    campus: { type: String, required: true },
    studentCount: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

export default (mongoose.models.ExamSession as mongoose.Model<IExamSession>) || mongoose.model<IExamSession>('ExamSession', ExamSessionSchema);
