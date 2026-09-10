import { Schema, model, type Document, type Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  company?: string;
  role: string;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, required: true },
  company: { type: String, default: '', trim: true },
  role: { type: String, default: 'manager' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    const obj = ret as unknown as Record<string, unknown>;
    obj.id = ret._id.toString();
    delete obj._id;
    delete obj.__v;
    delete obj.password;
    return obj;
  },
});

export const User: Model<IUser> = model<IUser>('User', userSchema);
