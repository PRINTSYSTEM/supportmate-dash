import mongoose, { Schema, Document } from 'mongoose';

export interface IRegistration extends Document {
  studentId: string;
  customerName: string;
  subjectId: string;
  examSessionId: string;
  toolId: string | null;
  keyCode: string | null;
  keyType: 'by_day' | 'by_term' | null;
  sellerId: string;
  processStatus: 'pending' | 'assigned' | 'supporting' | 'done' | 'cancelled';
  note: string;
  createdAt: Date;
  updatedAt: Date;
}

const RegistrationSchema = new Schema<IRegistration>(
  {
    studentId: { type: String, required: true, trim: true, maxlength: 20 },
    customerName: { type: String, required: true, trim: true, maxlength: 100 },
    subjectId: { type: String, required: true },
    examSessionId: { type: String, required: true },
    toolId: { type: String, default: null },
    keyCode: { type: String, default: null },
    keyType: { type: String, enum: ['by_day', 'by_term', null], default: null },
    sellerId: { type: String, required: true },
    processStatus: {
      type: String,
      enum: ['pending', 'assigned', 'supporting', 'done', 'cancelled'],
      default: 'pending',
    },
    note: { type: String, default: '', maxlength: 500 },
  },
  { timestamps: true }
);

export default (mongoose.models.Registration as mongoose.Model<IRegistration>) || mongoose.model<IRegistration>('Registration', RegistrationSchema);
