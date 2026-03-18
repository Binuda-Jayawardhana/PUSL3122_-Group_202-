const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const {
  createRoom,
  getRooms,
  getRoom,
  updateRoom,
  deleteRoom,
  getTemplates,
} = require('../controllers/roomController');

const router = express.Router();

// All routes require auth
router.use(protect);

// Get room templates
router.get('/templates', getTemplates);

// CRUD routes
router
  .route('/')
  .get(getRooms)
  .post(
    [
      body('name').trim().notEmpty().withMessage('Room name is required'),
      body('width').isNumeric().withMessage('Width must be a number'),
      body('height').isNumeric().withMessage('Height must be a number'),
      body('depth').isNumeric().withMessage('Depth must be a number'),
    ],
    validate,
    createRoom
  );

router.route('/:id').get(getRoom).put(updateRoom).delete(deleteRoom);

module.exports = router;
