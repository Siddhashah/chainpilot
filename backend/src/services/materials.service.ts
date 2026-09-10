import { Material, type IMaterial } from '../models/Material.js';
import { AppError } from '../middleware/errorHandler.js';

export interface EnrichedMaterial extends IMaterial {
  stockPercentage?: number;
  daysUntilStockout?: number | null;
}

function enrich(mat: IMaterial): Record<string, unknown> {
  const json = mat.toJSON() as Record<string, unknown>;
  const cap = mat.totalStorageCapacity || 0;
  const cur = mat.currentStock || 0;
  const daily = mat.dailyUsage || 0;
  json.stockPercentage = cap > 0 ? Math.round((cur / cap) * 1000) / 10 : 0;
  json.daysUntilStockout = daily > 0 ? Math.trunc(cur / daily) : null;
  return json;
}

export async function listMaterials(userId: string) {
  const materials = await Material.find({ userId, isActive: true }).sort({ name: 1 });
  return materials.map(enrich);
}

export async function createMaterial(userId: string, data: Record<string, unknown>) {
  const name = (data.name as string) ?? '';
  if (!name) throw new AppError('Name required');

  const material = await Material.create({
    userId,
    name,
    description: data.description ?? '',
    unit: data.unit ?? 'units',
    category: data.category ?? '',
    supplier: data.supplier ?? '',
    leadTimeDays: Number(data.leadTimeDays ?? 7),
    currentStock: Number(data.currentStock ?? 0),
    totalStorageCapacity: Number(data.totalStorageCapacity ?? 0),
    dailyUsage: Number(data.dailyUsage ?? 0),
    unitCost: Number(data.unitCost ?? 0),
  });
  return enrich(material);
}

async function findOwned(userId: string, id: string): Promise<IMaterial> {
  const material = await Material.findOne({ _id: id, userId }).catch(() => null);
  if (!material) throw new AppError('Not found', 404);
  return material;
}

export async function getMaterial(userId: string, id: string) {
  return enrich(await findOwned(userId, id));
}

const UPDATABLE_FIELDS = [
  'name', 'description', 'unit', 'category', 'supplier',
  'leadTimeDays', 'currentStock', 'totalStorageCapacity', 'dailyUsage', 'unitCost',
] as const;

export async function updateMaterial(userId: string, id: string, data: Record<string, unknown>) {
  const material = await findOwned(userId, id);
  for (const field of UPDATABLE_FIELDS) {
    if (field in data) (material as unknown as Record<string, unknown>)[field] = data[field];
  }
  material.updatedAt = new Date();
  await material.save();
  return enrich(material);
}

export async function deleteMaterial(userId: string, id: string): Promise<void> {
  const material = await findOwned(userId, id);
  material.isActive = false;
  await material.save();
}

const STOCK_FIELD_MAP: Record<string, keyof IMaterial> = {
  currentStock: 'currentStock',
  totalStorageCapacity: 'totalStorageCapacity',
  dailyUsage: 'dailyUsage',
};

export async function updateStock(userId: string, id: string, data: Record<string, unknown>) {
  const material = await findOwned(userId, id);
  for (const [key, field] of Object.entries(STOCK_FIELD_MAP)) {
    if (key in data) {
      const val = Number(data[key]);
      if (!Number.isNaN(val)) (material as unknown as Record<string, unknown>)[field] = val;
    }
  }
  material.updatedAt = new Date();
  await material.save();
  return enrich(material);
}
