const mongoose = require('mongoose');

const furnitureSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a furniture name'],
      trim: true,
      maxlength: [100, 'Furniture name cannot exceed 100 characters'],
    },
    category: {
      type: String,
      required: [true, 'Please provide a category'],
      enum: ['chair', 'armchair', 'table', 'dining-table', 'side-table', 'coffee-table', 'sofa', 'shelf', 'cabinet', 'cupboard', 'bed', 'desk', 'wardrobe', 'tv-unit'],
    },
    defaultColor: {
      type: String,
      default: '#8B4513',
    },
    dimensions: {
      width: {
        type: Number,
        required: [true, 'Please provide width'],
        min: [0.1, 'Width must be positive'],
      },
      height: {
        type: Number,
        required: [true, 'Please provide height'],
        min: [0.1, 'Height must be positive'],
      },
      depth: {
        type: Number,
        required: [true, 'Please provide depth'],
        min: [0.1, 'Depth must be positive'],
      },
    },
    modelPath2D: {
      type: String,
      default: '',
    },
    modelPath3D: {
      type: String,
      default: '',
    },
    thumbnail: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price'],
      min: [0, 'Price cannot be negative'],
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Furniture', furnitureSchema);
