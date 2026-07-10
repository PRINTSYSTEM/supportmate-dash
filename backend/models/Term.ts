import mongoose, { Schema, Document } from 'mongoose';

export interface ITerm extends Document {
  termId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const TermSchema = new Schema<ITerm>(
  {
    termId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export default (mongoose.models.Term as mongoose.Model<ITerm>) ||
  mongoose.model<ITerm>('Term', TermSchema);
