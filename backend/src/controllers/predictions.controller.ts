import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as predictionsService from '../services/predictions.service.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const predictions = await predictionsService.listPredictions(req.userId!);
  res.json({ success: true, data: predictions });
});

export const generate = asyncHandler(async (req: Request, res: Response) => {
  const prediction = await predictionsService.generatePrediction(req.userId!, (req.params.materialId as string));
  res.json({ success: true, data: prediction.toJSON() });
});

export const comparison = asyncHandler(async (req: Request, res: Response) => {
  const data = await predictionsService.getComparison(req.userId!, (req.params.materialId as string));
  res.json({ success: true, data });
});
