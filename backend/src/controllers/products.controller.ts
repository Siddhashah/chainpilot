import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as productsService from '../services/products.service.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const products = await productsService.listProducts(req.userId!);
  res.json({ success: true, data: products.map((p) => p.toJSON()) });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const product = await productsService.createProduct(req.userId!, req.body);
  res.status(201).json({ success: true, data: product.toJSON() });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const product = await productsService.getProduct(req.userId!, (req.params.id as string));
  res.json({ success: true, data: product.toJSON() });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const product = await productsService.updateProduct(req.userId!, (req.params.id as string), req.body);
  res.json({ success: true, data: product.toJSON() });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await productsService.deleteProduct(req.userId!, (req.params.id as string));
  res.json({ success: true, message: 'Deleted' });
});
