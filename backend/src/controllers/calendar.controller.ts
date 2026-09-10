import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as calendarService from '../services/calendar.service.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const events = await calendarService.listEvents(req.userId!, req.query as Record<string, string>);
  res.json({ success: true, data: events });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const event = await calendarService.createEvent(req.userId!, req.body);
  res.status(201).json({ success: true, data: event.toJSON() });
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const event = await calendarService.getEvent(req.userId!, (req.params.id as string));
  res.json({ success: true, data: event.toJSON() });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const event = await calendarService.updateEvent(req.userId!, (req.params.id as string), req.body);
  res.json({ success: true, data: event.toJSON() });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await calendarService.deleteEvent(req.userId!, (req.params.id as string));
  res.json({ success: true, message: 'Deleted' });
});
