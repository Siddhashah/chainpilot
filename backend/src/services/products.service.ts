import { Product, type IProduct } from '../models/Product.js';
import { Material } from '../models/Material.js';
import { AppError } from '../middleware/errorHandler.js';

export async function listProducts(userId: string): Promise<IProduct[]> {
  return Product.find({ userId, isActive: true }).sort({ _id: -1 });
}

export async function createProduct(userId: string, data: Record<string, unknown>): Promise<IProduct> {
  const name = (data.name as string) ?? '';
  if (!name) throw new AppError('Name required');

  const materials = (data.materials as Array<{ materialName?: string; unit?: string }>) ?? [];

  const product = await Product.create({
    userId,
    name,
    description: data.description ?? '',
    sku: data.sku ?? '',
    category: data.category ?? '',
    productionCycle: data.productionCycle ?? 'monthly',
    materials,
  });

  // Auto-create any materials referenced in the BOM that don't already exist
  for (const mat of materials) {
    const matName = mat.materialName ?? '';
    if (!matName) continue;
    const existing = await Material.findOne({
      userId,
      name: { $regex: `^${escapeRegExp(matName)}$`, $options: 'i' },
      isActive: true,
    });
    if (!existing) {
      await Material.create({
        userId,
        name: matName,
        unit: mat.unit ?? 'units',
      });
    }
  }

  return product;
}

export async function getProduct(userId: string, id: string): Promise<IProduct> {
  const product = await Product.findOne({ _id: id, userId }).catch(() => null);
  if (!product) throw new AppError('Not found', 404);
  return product;
}

export async function updateProduct(
  userId: string,
  id: string,
  data: Record<string, unknown>
): Promise<IProduct> {
  const product = await getProduct(userId, id);
  for (const field of ['name', 'description', 'sku', 'category'] as const) {
    if (field in data) (product as unknown as Record<string, unknown>)[field] = data[field];
  }
  if ('productionCycle' in data) product.productionCycle = data.productionCycle as string;
  if ('materials' in data) product.materials = data.materials as IProduct['materials'];
  product.updatedAt = new Date();
  await product.save();
  return product;
}

export async function deleteProduct(userId: string, id: string): Promise<void> {
  const product = await getProduct(userId, id);
  product.isActive = false;
  await product.save();
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
