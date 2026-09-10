import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as materialsService from '../services/materials.service.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const materials = await materialsService.listMaterials(req.userId!);
  res.json({ success: true, data: materials });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const material = await materialsService.createMaterial(req.userId!, req.body);
  res.status(201).json({ success: true, data: material });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const material = await materialsService.getMaterial(req.userId!, (req.params.id as string));
  res.json({ success: true, data: material });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const material = await materialsService.updateMaterial(req.userId!, (req.params.id as string), req.body);
  res.json({ success: true, data: material });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await materialsService.deleteMaterial(req.userId!, (req.params.id as string));
  res.json({ success: true, message: 'Deleted' });
});

export const updateStock = asyncHandler(async (req: Request, res: Response) => {
  const material = await materialsService.updateStock(req.userId!, (req.params.id as string), req.body);
  res.json({ success: true, data: material });
});
