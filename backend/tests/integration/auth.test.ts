import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../../src/app.js';

let mongod: MongoMemoryServer;
const app = createApp();

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

describe('Auth', () => {
  it('registers a new user and returns tokens', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'password123',
      company: 'Analytical Engines Inc',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('ada@example.com');
    expect(res.body.user.password).toBeUndefined();
  });

  it('rejects registration with a short password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Ada',
      email: 'ada2@example.com',
      password: '123',
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejects duplicate email registration', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Ada',
      email: 'dup@example.com',
      password: 'password123',
    });
    const res = await request(app).post('/api/auth/register').send({
      name: 'Ada 2',
      email: 'dup@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(400);
  });

  it('logs in with correct credentials and rejects incorrect ones', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Grace Hopper',
      email: 'grace@example.com',
      password: 'password123',
    });

    const good = await request(app)
      .post('/api/auth/login')
      .send({ email: 'grace@example.com', password: 'password123' });
    expect(good.status).toBe(200);
    expect(good.body.token).toBeDefined();

    const bad = await request(app)
      .post('/api/auth/login')
      .send({ email: 'grace@example.com', password: 'wrongpassword' });
    expect(bad.status).toBe(401);
  });

  it('returns the current user for a valid token, and 401 for a missing/invalid one', async () => {
    const reg = await request(app).post('/api/auth/register').send({
      name: 'Alan Turing',
      email: 'alan@example.com',
      password: 'password123',
    });
    const token = reg.body.token;

    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe('alan@example.com');

    const noAuth = await request(app).get('/api/auth/me');
    expect(noAuth.status).toBe(401);

    const badToken = await request(app).get('/api/auth/me').set('Authorization', 'Bearer garbage');
    expect(badToken.status).toBe(401);
  });

  it('updates the profile for an authenticated user', async () => {
    const reg = await request(app).post('/api/auth/register').send({
      name: 'Original Name',
      email: 'update@example.com',
      password: 'password123',
    });
    const token = reg.body.token;

    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Name', company: 'New Co' });

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Updated Name');
    expect(res.body.user.company).toBe('New Co');
  });

  it('issues a new access token from a valid refresh token', async () => {
    const reg = await request(app).post('/api/auth/register').send({
      name: 'Refresh Test',
      email: 'refresh@example.com',
      password: 'password123',
    });
    const res = await request(app)
      .post('/api/auth/token/refresh')
      .send({ refresh: reg.body.refresh });
    expect(res.status).toBe(200);
    expect(res.body.access).toBeDefined();
  });
});
