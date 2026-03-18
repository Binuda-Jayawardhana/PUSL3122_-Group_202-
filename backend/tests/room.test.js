const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');
const Room = require('../models/Room');

let mongoServer;
let adminToken;
let userToken;
let adminId;

beforeAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Room.deleteMany({});

  // Create admin user
  const adminRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Admin',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
    });
  adminToken = adminRes.body.token;
  adminId = adminRes.body.user._id;

  // Create regular user
  const userRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'User',
      email: 'user@test.com',
      password: 'password123',
    });
  userToken = userRes.body.token;
});

describe('Room API', () => {
  describe('POST /api/rooms', () => {
    it('should create a new room', async () => {
      const res = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Room',
          width: 5,
          height: 3,
          depth: 4,
          shape: 'rectangular',
          wallColor: '#FFFFFF',
          floorColor: '#D2B48C',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.room.name).toBe('Test Room');
      expect(res.body.room.width).toBe(5);
    });

    it('should create a custom l-shaped room', async () => {
      const res = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'L-Shaped Custom Room',
          width: 8,
          height: 3,
          depth: 8,
          shape: 'l-shaped',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.room.shape).toBe('l-shaped');
    });

    it('should not create room without auth', async () => {
      const res = await request(app)
        .post('/api/rooms')
        .send({
          name: 'Test Room',
          width: 5,
          height: 3,
          depth: 4,
        });

      expect(res.statusCode).toBe(401);
    });

    it('should not create room without required fields', async () => {
      const res = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Room',
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/rooms', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Room 1',
          width: 5,
          height: 3,
          depth: 4,
        });

      await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Template Room',
          width: 6,
          height: 3,
          depth: 5,
          isTemplate: true,
          templateCategory: 'living-room',
        });
    });

    it('should get all rooms for admin', async () => {
      const res = await request(app)
        .get('/api/rooms')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.rooms.length).toBe(2);
    });

    it('should get templates for regular user', async () => {
      const res = await request(app)
        .get('/api/rooms?templatesOnly=true')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.rooms.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/rooms/templates', () => {
    it('should get room templates', async () => {
      await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Template',
          width: 5,
          height: 3,
          depth: 4,
          isTemplate: true,
          templateCategory: 'bedroom',
        });

      const res = await request(app)
        .get('/api/rooms/templates')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.rooms.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('PUT /api/rooms/:id', () => {
    it('should update room properties', async () => {
      const createRes = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Room to Update',
          width: 5,
          height: 3,
          depth: 4,
        });

      const res = await request(app)
        .put(`/api/rooms/${createRes.body.room._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          wallColor: '#FF0000',
          name: 'Updated Room',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.room.wallColor).toBe('#FF0000');
      expect(res.body.room.name).toBe('Updated Room');
    });
  });

  describe('DELETE /api/rooms/:id', () => {
    it('should delete a room', async () => {
      const createRes = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Room to Delete',
          width: 5,
          height: 3,
          depth: 4,
        });

      const res = await request(app)
        .delete(`/api/rooms/${createRes.body.room._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Room deleted successfully');
    });
  });
});
