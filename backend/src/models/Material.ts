import { Schema, model, type Document, type Model } from 'mongoose';

export interface IMaterial extends Document {
  userId: string;
  name: string;
  description: string;
  unit: string;
  category: string;
  supplier: string;
  leadTimeDays: number;
  currentStock: number;
  totalStorageCapacity: number;
  dailyUsage: number;
  unitCost: number;
  nextResupplyDate?: string;
  predictionConfidence?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const materialSchema = new Schema<IMaterial>({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  unit: { type: String, default: 'units' },
  category: { type: String, default: '' },
  supplier: { type: String, default: '' },
  leadTimeDays: { type: Number, default: 7 },
  currentStock: { type: Number, default: 0 },
  totalStorageCapacity: { type: Number, default: 0 },
  dailyUsage: { type: Number, default: 0 },
  unitCost: { type: Number, default: 0 },
  nextResupplyDate: { type: String },
  predictionConfidence: { type: Number },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

materialSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    obj.id = ret._id.toString();
    delete obj._id;
    delete obj.__v;
    return obj;
  },
});

export const Material: Model<IMaterial> = model<IMaterial>('Material', materialSchema);
