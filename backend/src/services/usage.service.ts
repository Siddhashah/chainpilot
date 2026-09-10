import { parse as parseCsvSync } from 'csv-parse/sync';
import { UsageEntry } from '../models/UsageEntry.js';
import { Material } from '../models/Material.js';
import { AppError } from '../middleware/errorHandler.js';

async function updateRollingAverage(userId: string, materialId: string): Promise<void> {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - 30);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const entries = await UsageEntry.find({ userId, materialId, date: { $gte: cutoffStr } });
  if (entries.length) {
    const avg = entries.reduce((sum, e) => sum + e.quantity, 0) / entries.length;
    await Material.updateOne({ _id: materialId }, { $set: { dailyUsage: Math.round(avg * 100) / 100 } });
  }
}

export async function listUsage(userId: string, materialId: string) {
  return UsageEntry.find({ userId, materialId }).sort({ date: -1 }).limit(365);
}

export async function logUsage(userId: string, data: Record<string, unknown>) {
  const materialId = String(data.materialId ?? data.material ?? '');
  const date = String(data.date ?? '');
  const notes = String(data.notes ?? '');

  if (!materialId) throw new AppError('materialId is required');
  if (!date) throw new AppError('date is required');

  const quantity = Number(data.quantity ?? 0);
  if (Number.isNaN(quantity)) throw new AppError('quantity must be a number');

  const material = await Material.findOne({ _id: materialId, userId }).catch(() => null);
  if (!material) throw new AppError('Material not found', 404);

  let entry = await UsageEntry.findOne({ userId, materialId, date });
  if (entry) {
    entry.quantity = quantity;
    entry.notes = notes;
    entry.source = 'manual';
    await entry.save();
  } else {
    entry = await UsageEntry.create({ userId, materialId, date, quantity, notes, source: 'manual' });
  }

  await updateRollingAverage(userId, materialId);
  return entry;
}

interface ParsedRow {
  date: string;
  quantity: number;
  notes?: string;
}

function parseCsvUsage(content: string): ParsedRow[] {
  const results: ParsedRow[] = [];
  try {
    const records: string[][] = parseCsvSync(content.trim(), { columns: false, skip_empty_lines: true });
    if (!records.length) return [];

    const headers = records[0].map((h) => h.toLowerCase().trim());
    const dateIdx = headers.findIndex((h) => h.includes('date'));
    const qtyIdx = headers.findIndex((h) => ['qty', 'quantity', 'usage', 'amount'].some((k) => h.includes(k)));
    if (dateIdx === -1 || qtyIdx === -1) return [];

    for (const row of records.slice(1)) {
      const d = String(row[dateIdx] ?? '').trim();
      const q = parseFloat(row[qtyIdx]);
      if (d && !Number.isNaN(q) && q >= 0) results.push({ date: d, quantity: q, notes: '' });
    }
  } catch {
    // return whatever was parsed before the error
  }
  return results;
}

function parseXmlUsage(content: string): ParsedRow[] {
  const results: ParsedRow[] = [];
  const blockPattern = /<(?:entry|record|row|item)[^>]*>(.*?)<\/(?:entry|record|row|item)>/gis;
  let match: RegExpExecArray | null;
  while ((match = blockPattern.exec(content)) !== null) {
    const block = match[1];
    const dateMatch = /<date[^>]*>([^<]+)<\/date>/i.exec(block);
    const qtyMatch = /<(?:quantity|qty|usage|amount)[^>]*>([^<]+)<\/(?:quantity|qty|usage|amount)>/i.exec(block);
    if (dateMatch && qtyMatch) {
      const q = parseFloat(qtyMatch[1].trim());
      if (!Number.isNaN(q)) results.push({ date: dateMatch[1].trim(), quantity: q });
    }
  }
  return results;
}

export async function uploadUsage(
  userId: string,
  materialId: string,
  filename: string,
  buffer: Buffer
) {
  const material = await Material.findOne({ _id: materialId, userId }).catch(() => null);
  if (!material) throw new AppError('Material not found', 404);

  const lower = filename.toLowerCase();
  const content = buffer.toString('utf-8');
  let parsed: ParsedRow[];
  let source: 'csv_upload' | 'xml_upload';

  if (lower.endsWith('.csv')) {
    parsed = parseCsvUsage(content);
    source = 'csv_upload';
  } else if (lower.endsWith('.xml')) {
    parsed = parseXmlUsage(content);
    source = 'xml_upload';
  } else {
    throw new AppError('Only CSV and XML files allowed');
  }

  if (!parsed.length) throw new AppError('No valid data found in file');

  await UsageEntry.deleteMany({ userId, materialId, source: { $in: ['csv_upload', 'xml_upload'] } });

  let created = 0;
  for (const row of parsed) {
    try {
      await UsageEntry.updateOne(
        { userId, materialId, date: row.date },
        {
          $set: {
            quantity: row.quantity,
            source,
            notes: row.notes || `Imported from ${filename}`,
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );
      created += 1;
    } catch {
      continue;
    }
  }

  await updateRollingAverage(userId, materialId);
  return { message: `Imported ${created} usage records`, count: created };
}
