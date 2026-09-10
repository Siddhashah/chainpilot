import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as authService from '../services/auth.service.js';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { user, access, refresh } = await authService.registerUser(req.body);
  res.status(201).json({ success: true, token: access, refresh, user: user.toJSON() });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { user, access, refresh } = await authService.loginUser(req.body);
  res.json({ success: true, token: access, refresh, user: user.toJSON() });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getUserById(req.userId!);
  res.json({ success: true, user: user.toJSON() });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.updateProfile(req.userId!, req.body);
  res.json({ success: true, user: user.toJSON() });
});

export const tokenRefresh = asyncHandler(async (req: Request, res: Response) => {
  const result = authService.refreshAccessToken(req.body.refresh);
  res.json(result);
});
