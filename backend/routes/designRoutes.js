const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const {
  createDesign,
  getDesigns,
  getDesign,
  updateDesign,
  deleteDesign,
  addFurniture,
  updateFurnitureInDesign,
  removeFurnitureFromDesign,
  scaleDesign,
  shadeDesign,
  colorDesign,
} = require('../controllers/designController');

const router = express.Router();

// All routes require auth
router.use(protect);

// CRUD routes
router
  .route('/')
  .get(getDesigns)
  .post(
    [
      body('name').trim().notEmpty().withMessage('Design name is required'),
      body('room').notEmpty().withMessage('Room ID is required'),
    ],
    validate,
    createDesign
  );

router.route('/:id').get(getDesign).put(updateDesign).delete(deleteDesign);

// Furniture management within design
router.post('/:id/furniture', addFurniture);
router.put('/:id/furniture/:itemId', updateFurnitureInDesign);
router.delete('/:id/furniture/:itemId', removeFurnitureFromDesign);

// Scale design to fit room
router.put('/:id/scale', scaleDesign);

// Shading
router.put('/:id/shade', shadeDesign);

// Color
router.put('/:id/color', colorDesign);

module.exports = router;
