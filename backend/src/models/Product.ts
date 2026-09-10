import { Schema, model, type Document, type Model } from 'mongoose';

export interface IProductMaterial {
  materialName: string;
  quantity?: number;
  unit?: string;
}

export interface IProduct extends Document {
  userId: string;
  name: string;
  description: string;
  sku: string;
  category: string;
  productionCycle: string;
  materials: IProductMaterial[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productMaterialSchema = new Schema<IProductMaterial>(
  {
    materialName: { type: String, required: true },
    quantity: { type: Number, default: 0 },
    unit: { type: String, default: 'units' },
  },
  { _id: false }
);

const productSchema = new Schema<IProduct>({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  sku: { type: String, default: '' },
  category: { type: String, default: '' },
  productionCycle: { type: String, default: 'monthly' },
  materials: { type: [productMaterialSchema], default: [] },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

productSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    obj.id = ret._id.toString();
    delete obj._id;
    delete obj.__v;
    return obj;
  },
});

export const Product: Model<IProduct> = model<IProduct>('Product', productSchema);
