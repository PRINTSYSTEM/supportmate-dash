import mongoose, { Schema, Document } from 'mongoose';

export interface IExamTypeSlot {
  type: 'PE' | 'FE' | 'RETAKE_PE' | 'RETAKE_FE';
  time: string;
}

export interface IToolSubject {
  subjectId: string;
  examTypes: IExamTypeSlot[];
}

export interface IToolDate {
  date: string;
  subjects: IToolSubject[];
}

export interface IPriceSnapshot {
  toolPrice: number;
  feSlotPrice: number;
  peSlotPrice: number;
  feSlotCount: number;
  peSlotCount: number;
  discountEnabled: boolean;
  discountAmount: number;
}

export interface IToolRegistration extends Document {
  studentId: string;
  customerName: string;
  toolPackage: 'day' | 'term';
  toolTypeId: string;
  keyCode: string | null;
  processStatus: 'pending' | 'assigned' | 'done' | 'cancelled';
  dates: IToolDate[];
  priceSnapshot: IPriceSnapshot;
  totalPrice: number;
  note: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExamTypeSlotSchema = new Schema<IExamTypeSlot>(
  {
    type: { type: String, enum: ['PE', 'FE', 'RETAKE_PE', 'RETAKE_FE'], required: true },
    time: { type: String, required: true },
  },
  { _id: false }
);

const ToolSubjectSchema = new Schema<IToolSubject>(
  {
    subjectId: { type: String, required: true },
    examTypes: { type: [ExamTypeSlotSchema], required: true, validate: [v => v.length >= 1 && v.length <= 2, 'Must select 1-2 exam types'] },
  },
  { _id: false }
);

const ToolDateSchema = new Schema<IToolDate>(
  {
    date: { type: String, required: true },
    subjects: { type: [ToolSubjectSchema], required: true },
  },
  { _id: false }
);

const PriceSnapshotSchema = new Schema<IPriceSnapshot>(
  {
    toolPrice: { type: Number, required: true },
    feSlotPrice: { type: Number, required: true },
    peSlotPrice: { type: Number, required: true },
    feSlotCount: { type: Number, required: true },
    peSlotCount: { type: Number, required: true },
    discountEnabled: { type: Boolean, required: true },
    discountAmount: { type: Number, required: true },
  },
  { _id: false }
);

const ToolRegistrationSchema = new Schema<IToolRegistration>(
  {
    studentId: { type: String, required: true, trim: true, maxlength: 20 },
    customerName: { type: String, required: true, trim: true, maxlength: 100 },
    toolPackage: { type: String, enum: ['day', 'term'], required: true },
    toolTypeId: { type: String, required: true },
    keyCode: { type: String, default: null },
    processStatus: {
      type: String,
      enum: ['pending', 'assigned', 'done', 'cancelled'],
      default: 'pending',
    },
    dates: { type: [ToolDateSchema], required: true },
    priceSnapshot: { type: PriceSnapshotSchema, required: true },
    totalPrice: { type: Number, required: true, min: 0 },
    note: { type: String, default: '', maxlength: 500 },
  },
  { timestamps: true }
);

ToolRegistrationSchema.index({ studentId: 1, createdAt: -1 });
ToolRegistrationSchema.index({ processStatus: 1, createdAt: -1 });
ToolRegistrationSchema.index({ keyCode: 1 }, { sparse: true });

export default (mongoose.models.ToolRegistration as mongoose.Model<IToolRegistration>) || mongoose.model<IToolRegistration>('ToolRegistration', ToolRegistrationSchema);
