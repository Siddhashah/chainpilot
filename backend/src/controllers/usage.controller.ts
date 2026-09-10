import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as usageService from '../services/usage.service.js';
import { AppError } from '../middleware/errorHandler.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const entries = await usageService.listUsage(req.userId!, (req.params.materialId as string));
  res.json({ success: true, data: entries.map((e) => e.toJSON()) });
});

export const log = asyncHandler(async (req: Request, res: Response) => {
  const entry = await usageService.logUsage(req.userId!, req.body);
  res.status(201).json({ success: true, data: entry.toJSON() });
});

export const upload = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new AppError('No file provided');
  const result = await usageService.uploadUsage(
    req.userId!,
    (req.params.materialId as string),
    req.file.originalname,
    req.file.buffer
  );
  res.json({ success: true, ...result });
});
