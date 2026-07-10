import mongoose, { Schema, Document } from 'mongoose';

export interface ISeller extends Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const SellerSchema = new Schema<ISeller>(
  {
    name: { type: String, required: true },
  },
  { timestamps: true }
);

export default (mongoose.models.Seller as mongoose.Model<ISeller>) || mongoose.model<ISeller>('Seller', SellerSchema);
