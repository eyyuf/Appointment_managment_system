const request = require('supertest');
const app = require('../src/app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

afterAll(async () => { await prisma.$disconnect(); });

let studentToken, leaderToken, secretaryToken;
let leaderId, appointmentId;

beforeAll(async () => {
  // Login all test users
  const [s, l, sec] = await Promise.all([
    request(app).post('/api/auth/login').send({ email: 'student@university.edu', password: 'Pass@123' }),
    request(app).post('/api/auth/login').send({ email: 'depthead@university.edu', password: 'Pass@123' }),
    request(app).post('/api/auth/login').send({ email: 'secretary@university.edu', password: 'Pass@123' }),
  ]);
  studentToken = s.body.data?.accessToken;
  leaderToken = l.body.data?.accessToken;
  secretaryToken = sec.body.data?.accessToken;
  leaderId = l.body.data?.user?.id;
});

describe('Appointment API', () => {
  describe('POST /api/appointments', () => {
    it('should create an appointment', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          leaderId,
          title: 'Test Appointment',
          description: 'Testing appointment creation',
          date: tomorrow.toISOString().split('T')[0],
          startTime: '14:00',
          endTime: '14:30',
          location: 'Room 100',
        });
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      appointmentId = res.body.data.id;
    });

    it('should detect scheduling conflict', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          leaderId,
          title: 'Conflicting Appointment',
          date: tomorrow.toISOString().split('T')[0],
          startTime: '14:15',
          endTime: '14:45',
        });
      expect(res.status).toBe(409);
    });
  });

  describe('GET /api/appointments', () => {
    it('should return appointments for authenticated user', async () => {
      const res = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.appointments)).toBe(true);
    });
  });

  describe('POST /api/appointments/:id/cancel', () => {
    it('should cancel an appointment', async () => {
      if (!appointmentId) return;
      const res = await request(app)
        .post(`/api/appointments/${appointmentId}/cancel`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ cancellationReason: 'Testing cancellation flow' });
      expect(res.status).toBe(200);
    });
  });
});
