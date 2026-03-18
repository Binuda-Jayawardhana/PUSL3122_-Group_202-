const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a room name'],
      trim: true,
      maxlength: [100, 'Room name cannot exceed 100 characters'],
    },
    width: {
      type: Number,
      required: [true, 'Please provide room width'],
      min: [1, 'Width must be at least 1'],
    },
    height: {
      type: Number,
      required: [true, 'Please provide room height'],
      min: [1, 'Height must be at least 1'],
    },
    depth: {
      type: Number,
      required: [true, 'Please provide room depth'],
      min: [1, 'Depth must be at least 1'],
    },
    shape: {
      type: String,
      enum: ['rectangular', 'l-shaped', 't-shaped', 'open-plan', 'square', 'custom'],
      default: 'rectangular',
    },
    wallColor: {
      type: String,
      default: '#FFFFFF',
    },
    floorColor: {
      type: String,
      default: '#D2B48C',
    },
    ceilingColor: {
      type: String,
      default: '#FFFFFF',
    },
    isTemplate: {
      type: Boolean,
      default: false,
    },
    templateCategory: {
      type: String,
      enum: ['living-room', 'bedroom', 'dining-room', 'office', 'kitchen', 'bathroom', 'studio', 'custom'],
      default: 'custom',
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

module.exports = mongoose.model('Room', roomSchema);
