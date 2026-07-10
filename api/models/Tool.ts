import mongoose, { Schema, Document } from 'mongoose';

export interface ITool extends Document {
  name: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
}

const ToolSchema = new Schema<ITool>(
  {
    name: { type: String, required: true },
    version: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Tool || mongoose.model<ITool>('Tool', ToolSchema);
