import { Schema, model, type Document, type Model } from 'mongoose';

export interface IModelComparison {
  modelName: string;
  success: boolean;
  mape?: number;
  mae?: number;
  rmse?: number;
  error?: string;
}

export interface IPrediction extends Document {
  userId: string;
  materialId: string;
  materialName: string;
  predictedDailyUsage: number;
  estimatedStockoutDate?: string;
  recommendedResupplyDate?: string;
  recommendedOrderQuantity?: number;
  confidence?: number;
  trend: string;
  bestModel: string;
  usedEnsemble: boolean;
  ensembleTopN: number;
  dataPoints: number;
  modelUsed: string;
  modelsCompared: IModelComparison[];
  forecastData: Array<{ date: string; predictedUsage: number }>;
  generatedAt: Date;
}

const predictionSchema = new Schema<IPrediction>({
  userId: { type: String, required: true, index: true },
  materialId: { type: String, required: true, index: true },
  materialName: { type: String, default: '' },
  predictedDailyUsage: { type: Number, default: 0 },
  estimatedStockoutDate: { type: String },
  recommendedResupplyDate: { type: String },
  recommendedOrderQuantity: { type: Number },
  confidence: { type: Number },
  trend: { type: String, default: 'stable' },
  bestModel: { type: String, default: '' },
  usedEnsemble: { type: Boolean, default: false },
  ensembleTopN: { type: Number, default: 1 },
  dataPoints: { type: Number, default: 0 },
  modelUsed: { type: String, default: 'pipeline' },
  modelsCompared: { type: Schema.Types.Mixed, default: [] },
  forecastData: { type: Schema.Types.Mixed, default: [] },
  generatedAt: { type: Date, default: Date.now },
});

predictionSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    obj.id = ret._id.toString();
    delete obj._id;
    delete obj.__v;
    return obj;
  },
});

export const Prediction: Model<IPrediction> = model<IPrediction>('Prediction', predictionSchema);
