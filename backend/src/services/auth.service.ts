import bcrypt from 'bcryptjs';
import { User, type IUser } from '../models/User.js';
import { makeTokens, verifyToken } from '../utils/tokens.js';
import { AppError } from '../middleware/errorHandler.js';

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  company?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

function hashPassword(raw: string): string {
  return bcrypt.hashSync(raw, 10);
}

export async function registerUser(input: RegisterInput) {
  const name = input.name?.trim() ?? '';
  const email = input.email?.trim().toLowerCase() ?? '';
  const password = input.password ?? '';
  const company = input.company?.trim() ?? '';

  if (!name || !email || !password) {
    throw new AppError('Name, email and password are required');
  }
  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters');
  }
  if (await User.findOne({ email })) {
    throw new AppError('Email already registered');
  }

  const user = await User.create({
    name,
    email,
    password: hashPassword(password),
    company,
  });

  const tokens = makeTokens(user.id);
  return { user, ...tokens };
}

export async function loginUser(input: LoginInput) {
  const email = input.email?.trim().toLowerCase() ?? '';
  const password = input.password ?? '';

  const user = await User.findOne({ email });
  if (!user || !bcrypt.compareSync(password, user.password)) {
    throw new AppError('Invalid credentials', 401);
  }
  if (!user.isActive) {
    throw new AppError('Account deactivated', 401);
  }

  user.lastLogin = new Date();
  await user.save();

  const tokens = makeTokens(user.id);
  return { user, ...tokens };
}

export async function getUserById(userId: string): Promise<IUser> {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  return user;
}

export async function updateProfile(
  userId: string,
  updates: { name?: string; company?: string }
): Promise<IUser> {
  const user = await getUserById(userId);
  if (updates.name !== undefined) user.name = updates.name;
  if (updates.company !== undefined) user.company = updates.company;
  await user.save();
  return user;
}

export function refreshAccessToken(refreshToken: string): { access: string } {
  let payload;
  try {
    payload = verifyToken(refreshToken);
  } catch {
    throw new AppError('Token is invalid or expired', 401);
  }
  if (payload.tokenType !== 'refresh') {
    throw new AppError('Token is invalid or expired', 401);
  }
  const { access } = makeTokens(payload.userId);
  return { access };
}
