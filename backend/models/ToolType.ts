import mongoose, { Schema, Document } from 'mongoose';

export interface IToolType extends Document {
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ToolTypeSchema = new Schema<IToolType>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default (mongoose.models.ToolType as mongoose.Model<IToolType>) || mongoose.model<IToolType>('ToolType', ToolTypeSchema);
