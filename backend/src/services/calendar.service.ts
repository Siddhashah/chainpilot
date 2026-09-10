import { CalendarEvent, type ICalendarEvent } from '../models/CalendarEvent.js';
import { Material } from '../models/Material.js';
import { AppError } from '../middleware/errorHandler.js';

interface ListFilters {
  year?: string;
  month?: string;
  startDate?: string;
  endDate?: string;
}

export async function listEvents(userId: string, filters: ListFilters) {
  const query: Record<string, unknown> = { userId };

  if (filters.year && filters.month) {
    const prefix = `${filters.year.padStart(4, '0')}-${filters.month.padStart(2, '0')}`;
    query.date = { $regex: `^${prefix}` };
  } else if (filters.startDate && filters.endDate) {
    query.date = { $gte: filters.startDate, $lte: filters.endDate };
  }

  const events = await CalendarEvent.find(query).sort({ date: 1 });

  const results = [];
  for (const event of events) {
    const json = event.toJSON() as Record<string, unknown>;
    if (event.materialId) {
      const mat = await Material.findById(event.materialId).catch(() => null);
      json.materialName = mat ? mat.name : null;
    }
    results.push(json);
  }
  return results;
}

export async function createEvent(userId: string, data: Record<string, unknown>): Promise<ICalendarEvent> {
  const title = (data.title as string) ?? '';
  if (!title) throw new AppError('Title required');

  return CalendarEvent.create({
    userId,
    title,
    description: data.description ?? '',
    date: data.date ?? '',
    endDate: data.endDate ?? null,
    type: data.type ?? 'custom',
    priority: data.priority ?? 'medium',
    color: data.color ?? '#0E7C86',
    materialId: data.materialId ?? null,
  });
}

async function findOwned(userId: string, id: string): Promise<ICalendarEvent> {
  const event = await CalendarEvent.findOne({ _id: id, userId }).catch(() => null);
  if (!event) throw new AppError('Not found', 404);
  return event;
}

export async function getEvent(userId: string, id: string): Promise<ICalendarEvent> {
  return findOwned(userId, id);
}

export async function updateEvent(
  userId: string,
  id: string,
  data: Record<string, unknown>
): Promise<ICalendarEvent> {
  const event = await findOwned(userId, id);
  for (const field of ['title', 'description', 'date', 'type', 'priority', 'color', 'isCompleted'] as const) {
    if (field in data) (event as unknown as Record<string, unknown>)[field] = data[field];
  }
  if ('endDate' in data) event.endDate = data.endDate as string;
  if ('materialId' in data) event.materialId = data.materialId as string;
  await event.save();
  return event;
}

export async function deleteEvent(userId: string, id: string): Promise<void> {
  const event = await findOwned(userId, id);
  await event.deleteOne();
}
