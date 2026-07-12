import mongoose, { Schema, Document } from 'mongoose';

export interface IPricingConfig extends Document {
  toolDayPrice: number;
  toolTermPrice: number;
  feSlotPrice: number;
  peSlotPrice: number;
  discountEnabled: boolean;
  discountAmount: number;
  activeToolTypeId: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const PricingConfigSchema = new Schema<IPricingConfig>(
  {
    toolDayPrice: { type: Number, required: true, default: 800000, min: 0 },
    toolTermPrice: { type: Number, required: true, default: 1800000, min: 0 },
    feSlotPrice: { type: Number, required: true, default: 200000, min: 0 },
    peSlotPrice: { type: Number, required: true, default: 0, min: 0 },
    discountEnabled: { type: Boolean, default: true },
    discountAmount: { type: Number, required: true, default: 200000, min: 0 },
    activeToolTypeId: { type: String, default: null },
    updatedBy: { type: String, default: null },
  },
  { timestamps: true }
);

export default (mongoose.models.PricingConfig as mongoose.Model<IPricingConfig>) || mongoose.model<IPricingConfig>('PricingConfig', PricingConfigSchema);
