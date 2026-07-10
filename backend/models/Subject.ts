import mongoose, { Schema, Document } from 'mongoose';

export interface ISubject extends Document {
  subjectId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubjectSchema = new Schema<ISubject>(
  {
    subjectId: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export default (mongoose.models.Subject as mongoose.Model<ISubject>) ||
  mongoose.model<ISubject>('Subject', SubjectSchema);
