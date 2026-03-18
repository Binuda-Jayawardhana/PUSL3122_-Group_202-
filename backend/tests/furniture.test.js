const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');
const Furniture = require('../models/Furniture');

let mongoServer;
let adminToken;
let userToken;

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
  await Furniture.deleteMany({});

  // Create admin
  const adminRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Admin',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
    });
  adminToken = adminRes.body.token;

  // Create user
  const userRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'User',
      email: 'user@test.com',
      password: 'password123',
    });
  userToken = userRes.body.token;
});

describe('Furniture API', () => {
  describe('POST /api/furniture', () => {
    it('should create furniture (admin)', async () => {
      const res = await request(app)
        .post('/api/furniture')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Modern Chair',
          category: 'chair',
          defaultColor: '#8B4513',
          dimensions: { width: 0.5, height: 0.9, depth: 0.5 },
          description: 'A modern chair',
          price: 150,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.furniture.name).toBe('Modern Chair');
      expect(res.body.furniture.category).toBe('chair');
      expect(res.body.furniture.price).toBe(150);
    });

    it('should not allow negative price', async () => {
      const res = await request(app)
        .post('/api/furniture')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Free Chair',
          category: 'chair',
          dimensions: { width: 0.5, height: 0.9, depth: 0.5 },
          price: -10,
        });

      expect(res.statusCode).toBe(400);
    });

    it('should not allow regular user to create furniture', async () => {
      const res = await request(app)
        .post('/api/furniture')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Chair',
          category: 'chair',
          dimensions: { width: 0.5, height: 0.9, depth: 0.5 },
        });

      expect(res.statusCode).toBe(403);
    });

    it('should not create furniture with invalid category', async () => {
      const res = await request(app)
        .post('/api/furniture')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invalid',
          category: 'invalid-category',
          dimensions: { width: 0.5, height: 0.9, depth: 0.5 },
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/furniture', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/furniture')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Chair 1',
          category: 'chair',
          dimensions: { width: 0.5, height: 0.9, depth: 0.5 },
        });

      await request(app)
        .post('/api/furniture')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Table 1',
          category: 'dining-table',
          dimensions: { width: 1.5, height: 0.75, depth: 0.9 },
        });
    });

    it('should get all furniture', async () => {
      const res = await request(app)
        .get('/api/furniture')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.furniture.length).toBe(2);
    });

    it('should filter by category', async () => {
      const res = await request(app)
        .get('/api/furniture?category=chair')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.furniture.length).toBe(1);
      expect(res.body.furniture[0].category).toBe('chair');
    });

    it('should search by name', async () => {
      const res = await request(app)
        .get('/api/furniture?search=Chair')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.furniture.length).toBe(1);
    });

    it('regular user can read furniture', async () => {
      const res = await request(app)
        .get('/api/furniture')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.furniture.length).toBe(2);
    });
  });

  describe('GET /api/furniture/categories', () => {
    it('should get furniture categories', async () => {
      await request(app)
        .post('/api/furniture')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Chair',
          category: 'chair',
          dimensions: { width: 0.5, height: 0.9, depth: 0.5 },
        });

      const res = await request(app)
        .get('/api/furniture/categories')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.categories).toContain('chair');
    });
  });

  describe('PUT /api/furniture/:id', () => {
    it('should update furniture (admin)', async () => {
      const createRes = await request(app)
        .post('/api/furniture')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Old Chair',
          category: 'chair',
          dimensions: { width: 0.5, height: 0.9, depth: 0.5 },
        });

      const res = await request(app)
        .put(`/api/furniture/${createRes.body.furniture._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Chair', defaultColor: '#FF0000' });

      expect(res.statusCode).toBe(200);
      expect(res.body.furniture.name).toBe('Updated Chair');
      expect(res.body.furniture.defaultColor).toBe('#FF0000');
    });

    it('should not allow regular user to update', async () => {
      const createRes = await request(app)
        .post('/api/furniture')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Chair',
          category: 'chair',
          dimensions: { width: 0.5, height: 0.9, depth: 0.5 },
        });

      const res = await request(app)
        .put(`/api/furniture/${createRes.body.furniture._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Hacked Chair' });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('DELETE /api/furniture/:id', () => {
    it('should delete furniture (admin)', async () => {
      const createRes = await request(app)
        .post('/api/furniture')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Chair to Delete',
          category: 'chair',
          dimensions: { width: 0.5, height: 0.9, depth: 0.5 },
        });

      const res = await request(app)
        .delete(`/api/furniture/${createRes.body.furniture._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Furniture deleted successfully');
    });

    it('should not allow regular user to delete', async () => {
      const createRes = await request(app)
        .post('/api/furniture')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Chair',
          category: 'chair',
          dimensions: { width: 0.5, height: 0.9, depth: 0.5 },
        });

      const res = await request(app)
        .delete(`/api/furniture/${createRes.body.furniture._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(403);
    });
  });
});
