const mongoose = require('mongoose');

const furnitureItemSchema = new mongoose.Schema({
  furniture: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Furniture',
    required: true,
  },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  z: { type: Number, default: 0 },
  rotation: { type: Number, default: 0 },
  rotationX: { type: Number, default: 0 },
  rotationY: { type: Number, default: 0 },
  rotationZ: { type: Number, default: 0 },
  scaleX: { type: Number, default: 1 },
  scaleY: { type: Number, default: 1 },
  scaleZ: { type: Number, default: 1 },
  color: { type: String, default: '' },
  shading: {
    intensity: { type: Number, default: 1, min: 0, max: 2 },
    type: { type: String, enum: ['none', 'flat', 'smooth', 'glossy', 'matte'], default: 'none' },
  },
  locked: { type: Boolean, default: false },
});

const designSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a design name'],
      trim: true,
      maxlength: [100, 'Design name cannot exceed 100 characters'],
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Please provide a room for the design'],
    },
    furnitureItems: [furnitureItemSchema],
    globalShading: {
      intensity: { type: Number, default: 1, min: 0, max: 2 },
      type: { type: String, enum: ['none', 'flat', 'smooth', 'glossy', 'matte'], default: 'none' },
    },
    globalColor: {
      type: String,
      default: '',
    },
    is3DEnabled: {
      type: Boolean,
      default: false,
    },
    cameraPosition: {
      x: { type: Number, default: 5 },
      y: { type: Number, default: 5 },
      z: { type: Number, default: 5 },
    },
    thumbnail: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Design', designSchema);
