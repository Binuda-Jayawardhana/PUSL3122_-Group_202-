const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');
const Room = require('../models/Room');
const Design = require('../models/Design');
const Furniture = require('../models/Furniture');

let mongoServer;
let adminToken;
let roomId;
let furnitureId;

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
  await Design.deleteMany({});
  await Furniture.deleteMany({});

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

  // Create a room
  const roomRes = await request(app)
    .post('/api/rooms')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Test Room',
      width: 6,
      height: 3,
      depth: 5,
    });
  roomId = roomRes.body.room._id;

  // Create furniture
  const furnitureRes = await request(app)
    .post('/api/furniture')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Test Chair',
      category: 'chair',
      dimensions: { width: 0.5, height: 0.9, depth: 0.5 },
    });
  furnitureId = furnitureRes.body.furniture._id;
});

describe('Design API', () => {
  describe('POST /api/designs', () => {
    it('should create a new design', async () => {
      const res = await request(app)
        .post('/api/designs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'My Design',
          room: roomId,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.design.name).toBe('My Design');
    });

    it('should not create design without room', async () => {
      const res = await request(app)
        .post('/api/designs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'My Design',
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('Furniture in Design', () => {
    let designId;

    beforeEach(async () => {
      const designRes = await request(app)
        .post('/api/designs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Furniture Test Design',
          room: roomId,
        });
      designId = designRes.body.design._id;
    });

    it('should add furniture to design', async () => {
      const res = await request(app)
        .post(`/api/designs/${designId}/furniture`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          furniture: furnitureId,
          x: 2,
          y: 0,
          z: 1,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.design.furnitureItems.length).toBe(1);
      expect(res.body.design.furnitureItems[0].x).toBe(2);
    });

    it('should update furniture position in design', async () => {
      // Add furniture first
      const addRes = await request(app)
        .post(`/api/designs/${designId}/furniture`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          furniture: furnitureId,
          x: 1,
          y: 0,
          z: 1,
        });

      const itemId = addRes.body.design.furnitureItems[0]._id;

      // Update position
      const res = await request(app)
        .put(`/api/designs/${designId}/furniture/${itemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          x: 3,
          z: 2,
          rotation: 90,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.design.furnitureItems[0].x).toBe(3);
      expect(res.body.design.furnitureItems[0].z).toBe(2);
      expect(res.body.design.furnitureItems[0].rotation).toBe(90);
    });

    it('should save precise float coordinates during drag operations', async () => {
      // Add furniture first
      const addRes = await request(app)
        .post(`/api/designs/${designId}/furniture`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          furniture: furnitureId,
          x: 1,
          y: 0,
          z: 1,
        });

      const itemId = addRes.body.design.furnitureItems[0]._id;

      // Update position with floats (like dropping in 2D/3D)
      const res = await request(app)
        .put(`/api/designs/${designId}/furniture/${itemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          x: 3.456,
          z: 2.123,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.design.furnitureItems[0].x).toBe(3.456);
      expect(res.body.design.furnitureItems[0].z).toBe(2.123);
    });

    it('should remove furniture from design', async () => {
      // Add furniture first
      const addRes = await request(app)
        .post(`/api/designs/${designId}/furniture`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          furniture: furnitureId,
          x: 1,
          y: 0,
          z: 1,
        });

      const itemId = addRes.body.design.furnitureItems[0]._id;

      const res = await request(app)
        .delete(`/api/designs/${designId}/furniture/${itemId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.design.furnitureItems.length).toBe(0);
    });
  });

  describe('Scale Design', () => {
    it('should scale design with manual factor', async () => {
      const designRes = await request(app)
        .post('/api/designs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Scale Test',
          room: roomId,
        });

      // Add furniture
      await request(app)
        .post(`/api/designs/${designRes.body.design._id}/furniture`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          furniture: furnitureId,
          x: 2,
          y: 0,
          z: 1,
          scaleX: 1,
          scaleY: 1,
          scaleZ: 1,
        });

      const res = await request(app)
        .put(`/api/designs/${designRes.body.design._id}/scale`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ scaleFactor: 0.5 });

      expect(res.statusCode).toBe(200);
      expect(res.body.design.furnitureItems[0].scaleX).toBe(0.5);
    });
  });

  describe('Shade Design', () => {
    it('should apply shading to entire design', async () => {
      const designRes = await request(app)
        .post('/api/designs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Shade Test',
          room: roomId,
        });

      const res = await request(app)
        .put(`/api/designs/${designRes.body.design._id}/shade`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          intensity: 1.5,
          type: 'glossy',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.design.globalShading.intensity).toBe(1.5);
      expect(res.body.design.globalShading.type).toBe('glossy');
    });
  });

  describe('Color Design', () => {
    it('should change color of entire design', async () => {
      const designRes = await request(app)
        .post('/api/designs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Color Test',
          room: roomId,
        });

      // Add furniture
      await request(app)
        .post(`/api/designs/${designRes.body.design._id}/furniture`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          furniture: furnitureId,
          x: 1,
          y: 0,
          z: 1,
        });

      const res = await request(app)
        .put(`/api/designs/${designRes.body.design._id}/color`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ color: '#FF5722' });

      expect(res.statusCode).toBe(200);
      expect(res.body.design.globalColor).toBe('#FF5722');
      expect(res.body.design.furnitureItems[0].color).toBe('#FF5722');
    });
  });

  describe('DELETE /api/designs/:id', () => {
    it('should delete a design', async () => {
      const designRes = await request(app)
        .post('/api/designs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'To Delete',
          room: roomId,
        });

      const res = await request(app)
        .delete(`/api/designs/${designRes.body.design._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Design deleted successfully');
    });
  });
});
