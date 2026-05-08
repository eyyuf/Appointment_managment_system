const request = require('supertest');
const app = require('../src/app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Auth API', () => {
  const testEmail = `test_${Date.now()}@university.edu`;
  let accessToken;

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app).post('/api/auth/register').send({
        fullName: 'Test Student',
        email: testEmail,
        password: 'Test@1234',
        role: 'STUDENT',
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data.user.email).toBe(testEmail);
    });

    it('should reject duplicate email', async () => {
      const res = await request(app).post('/api/auth/register').send({
        fullName: 'Duplicate User',
        email: testEmail,
        password: 'Test@1234',
      });
      expect(res.status).toBe(409);
    });

    it('should reject weak password', async () => {
      const res = await request(app).post('/api/auth/register').send({
        fullName: 'Test User',
        email: `weak_${Date.now()}@university.edu`,
        password: '123456',
      });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testEmail,
        password: 'Test@1234',
      });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('accessToken');
      accessToken = res.body.data.accessToken;
    });

    it('should reject invalid password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testEmail,
        password: 'wrongpassword',
      });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user when authenticated', async () => {
      const loginRes = await request(app).post('/api/auth/login').send({
        email: testEmail, password: 'Test@1234',
      });
      const token = loginRes.body.data.accessToken;

      const res = await request(app).get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(testEmail);
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });
});
