import mongoose, { Schema, Document } from 'mongoose';

export interface IKey extends Document {
  keyCode: string;
  toolId: string;
  type: 'by_day' | 'by_term';
  status: 'available' | 'used';
  expirationDate: string;
  createdAt: Date;
  updatedAt: Date;
}

const KeySchema = new Schema<IKey>(
  {
    keyCode: { type: String, required: true, unique: true },
    toolId: { type: String, required: true },
    type: { type: String, enum: ['by_day', 'by_term'], required: true },
    status: { type: String, enum: ['available', 'used'], default: 'available' },
    expirationDate: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Key || mongoose.model<IKey>('Key', KeySchema);
