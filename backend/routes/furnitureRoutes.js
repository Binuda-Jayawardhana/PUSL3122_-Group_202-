const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const {
  createFurniture,
  getFurniture,
  getFurnitureById,
  updateFurniture,
  deleteFurniture,
  getCategories,
} = require('../controllers/furnitureController');

const router = express.Router();

// All routes require auth
router.use(protect);

// Get categories (must be before /:id route)
router.get('/categories', getCategories);

// CRUD routes
router
  .route('/')
  .get(getFurniture)
  .post(
    authorize('admin'),
    [
      body('name').trim().notEmpty().withMessage('Furniture name is required'),
      body('category')
        .isIn(['chair', 'armchair', 'table', 'dining-table', 'side-table', 'coffee-table', 'sofa', 'shelf', 'cabinet', 'cupboard', 'bed', 'desk', 'wardrobe', 'tv-unit'])
        .withMessage('Invalid category'),
      body('dimensions.width').isNumeric().withMessage('Width is required'),
      body('dimensions.height').isNumeric().withMessage('Height is required'),
      body('dimensions.depth').isNumeric().withMessage('Depth is required'),
    ],
    validate,
    createFurniture
  );

router
  .route('/:id')
  .get(getFurnitureById)
  .put(authorize('admin'), updateFurniture)
  .delete(authorize('admin'), deleteFurniture);

module.exports = router;
