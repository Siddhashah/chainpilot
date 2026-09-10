import { Schema, model, type Document, type Model } from 'mongoose';

export interface IUsageEntry extends Document {
  userId: string;
  materialId: string;
  date: string;
  quantity: number;
  notes: string;
  source: 'manual' | 'csv_upload' | 'xml_upload';
  createdAt: Date;
}

const usageEntrySchema = new Schema<IUsageEntry>({
  userId: { type: String, required: true, index: true },
  materialId: { type: String, required: true, index: true },
  date: { type: String, required: true },
  quantity: { type: Number, required: true },
  notes: { type: String, default: '' },
  source: { type: String, enum: ['manual', 'csv_upload', 'xml_upload'], default: 'manual' },
  createdAt: { type: Date, default: Date.now },
});

usageEntrySchema.set('toJSON', {
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    obj.id = ret._id.toString();
    delete obj._id;
    delete obj.__v;
    return obj;
  },
});

export const UsageEntry: Model<IUsageEntry> = model<IUsageEntry>('UsageEntry', usageEntrySchema);
