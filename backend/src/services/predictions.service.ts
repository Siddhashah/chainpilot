import axios from 'axios';
import { Prediction, type IPrediction } from '../models/Prediction.js';
import { Material } from '../models/Material.js';
import { UsageEntry } from '../models/UsageEntry.js';
import { CalendarEvent } from '../models/CalendarEvent.js';
import { AppError } from '../middleware/errorHandler.js';
import { env } from '../config/env.js';

export async function listPredictions(userId: string) {
  const predictions = await Prediction.find({ userId }).sort({ recommendedResupplyDate: 1 });

  const results = [];
  for (const p of predictions) {
    const json = p.toJSON() as Record<string, unknown>;
    const mat = await Material.findById(p.materialId).catch(() => null);
    if (mat) {
      json.materialUnit = mat.unit;
      json.materialCurrentStock = mat.currentStock;
    }
    results.push(json);
  }
  return results;
}

interface MlModelResult {
  best_model?: string;
  used_ensemble?: boolean;
  ensemble_top_n?: number;
  data_points?: number;
  trend?: string;
  predicted_daily_usage?: number;
  stockout_date?: string;
  resupply_date?: string;
  recommended_order_quantity?: number;
  confidence?: number;
  model_used?: string;
  models_compared?: unknown[];
  forecast_data?: unknown[];
}

interface RawModelResult {
  model_name?: string;
  success?: boolean;
  training_time_s?: number;
  mae?: number;
  rmse?: number;
  mape?: number;
  confidence?: number;
  cv_folds?: number;
  is_best?: boolean;
  error?: string;
}

function normalizeModelsCompared(raw: unknown[] | undefined): Record<string, unknown>[] {
  return (raw ?? []).map((entry) => {
    const r = entry as RawModelResult;
    return {
      modelName: r.model_name,
      success: r.success,
      trainingTimeS: r.training_time_s,
      mae: r.mae,
      rmse: r.rmse,
      mape: r.mape,
      confidence: r.confidence,
      cvFolds: r.cv_folds,
      isBest: r.is_best,
      error: r.error,
    };
  });
}

function simpleFallback(currentStock: number, leadTimeDays: number, usageEntries: { quantity: number }[]): MlModelResult {
  const values = usageEntries.slice(-30).map((u) => u.quantity);
  const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 1;
  const days = avg > 0 ? Math.trunc(currentStock / avg) : 999;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const stockoutDate = new Date(today);
  stockoutDate.setUTCDate(stockoutDate.getUTCDate() + days);

  let resupplyDate = new Date(stockoutDate);
  resupplyDate.setUTCDate(resupplyDate.getUTCDate() - leadTimeDays);
  if (resupplyDate < today) {
    resupplyDate = new Date(today);
    resupplyDate.setUTCDate(resupplyDate.getUTCDate() + 1);
  }

  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  return {
    best_model: 'naive_baseline',
    used_ensemble: false,
    ensemble_top_n: 1,
    models_compared: [],
    data_points: usageEntries.length,
    trend: 'stable',
    predicted_daily_usage: Math.round(avg * 100) / 100,
    stockout_date: fmt(stockoutDate),
    resupply_date: fmt(resupplyDate),
    recommended_order_quantity: Math.round(avg * 37 * 100) / 100,
    confidence: 0.5,
    model_used: 'naive_baseline',
    forecast_data: [],
  };
}

export async function generatePrediction(userId: string, materialId: string): Promise<IPrediction> {
  const material = await Material.findOne({ _id: materialId, userId }).catch(() => null);
  if (!material) throw new AppError('Material not found', 404);

  const usageEntries = await UsageEntry.find({ userId, materialId }).sort({ date: 1 });
  if (usageEntries.length < 3) throw new AppError('Need at least 3 usage data points');

  const payload = {
    material_id: materialId,
    material_name: material.name,
    current_stock: material.currentStock || 0,
    lead_time_days: material.leadTimeDays || 7,
    forecast_days: 90,
    use_ensemble: true,
    usage_data: usageEntries.map((u) => ({ date: u.date, quantity: u.quantity })),
  };

  let result: MlModelResult;
  try {
    const resp = await axios.post(`${env.mlServiceUrl}/predict`, payload, { timeout: 120000 });
    result = resp.data;
  } catch {
    result = simpleFallback(material.currentStock || 0, material.leadTimeDays || 7, usageEntries);
  }

  await Prediction.deleteMany({ userId, materialId });

  const prediction = await Prediction.create({
    userId,
    materialId,
    materialName: material.name,
    predictedDailyUsage: result.predicted_daily_usage ?? 0,
    estimatedStockoutDate: result.stockout_date,
    recommendedResupplyDate: result.resupply_date,
    recommendedOrderQuantity: result.recommended_order_quantity,
    confidence: result.confidence,
    trend: result.trend ?? 'stable',
    bestModel: result.best_model ?? '',
    usedEnsemble: result.used_ensemble ?? false,
    ensembleTopN: result.ensemble_top_n ?? 1,
    dataPoints: result.data_points ?? usageEntries.length,
    modelUsed: result.model_used ?? 'pipeline',
    modelsCompared: normalizeModelsCompared(result.models_compared),
    forecastData: result.forecast_data ?? [],
  });

  const matUpdates: Record<string, unknown> = {};
  if (prediction.recommendedResupplyDate) matUpdates.nextResupplyDate = prediction.recommendedResupplyDate;
  if (prediction.confidence) matUpdates.predictionConfidence = prediction.confidence;
  if (Object.keys(matUpdates).length) {
    await Material.updateOne({ _id: materialId }, { $set: matUpdates });
  }

  if (prediction.recommendedResupplyDate) {
    const confPct = Math.round((prediction.confidence ?? 0) * 100);
    await CalendarEvent.updateOne(
      { userId, materialId, isAutoGenerated: true, type: 'resupply' },
      {
        $set: {
          userId,
          materialId,
          title: `Resupply: ${material.name}`,
          description: `${prediction.bestModel} · Confidence ${confPct}%`,
          date: prediction.recommendedResupplyDate,
          type: 'resupply',
          priority: 'high',
          color: '#D97706',
          isAutoGenerated: true,
          isCompleted: false,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );
  }

  return prediction;
}

export async function getComparison(userId: string, materialId: string) {
  const prediction = await Prediction.findOne({ userId, materialId });
  if (!prediction) throw new AppError('No prediction found', 404);
  return prediction.modelsCompared ?? [];
}
