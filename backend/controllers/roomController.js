const Room = require('../models/Room');
const { successResponse, errorResponse, paginate } = require('../utils/helpers');

// @desc    Create a new room
// @route   POST /api/rooms
// @access  Private
const createRoom = async (req, res, next) => {
  try {
    req.body.createdBy = req.user._id;

    const room = await Room.create(req.body);

    successResponse(res, { room }, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all rooms for current user
// @route   GET /api/rooms
// @access  Private
const getRooms = async (req, res, next) => {
  try {
    const { skip, limit, page } = paginate(req.query.page, req.query.limit);

    const filter = {};

    // Admin can see all rooms, users see their own + templates
    if (req.user.role === 'admin') {
      // Admin sees all
    } else {
      filter.$or = [{ createdBy: req.user._id }, { isTemplate: true }];
    }

    // Filter by shape if provided
    if (req.query.shape) {
      filter.shape = req.query.shape;
    }

    // Filter templates only
    if (req.query.templatesOnly === 'true') {
      filter.isTemplate = true;
    }

    // Filter by category
    if (req.query.category) {
      filter.templateCategory = req.query.category;
    }

    const total = await Room.countDocuments(filter);
    const rooms = await Room.find(filter)
      .populate('createdBy', 'name email')
      .skip(skip)
      .limit(limit)
      .sort('-createdAt');

    successResponse(res, {
      rooms,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single room
// @route   GET /api/rooms/:id
// @access  Private
const getRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id).populate('createdBy', 'name email');

    if (!room) {
      return errorResponse(res, 'Room not found', 404);
    }

    // Check ownership or template
    if (
      room.createdBy._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin' &&
      !room.isTemplate
    ) {
      return errorResponse(res, 'Not authorized to access this room', 403);
    }

    successResponse(res, { room });
  } catch (error) {
    next(error);
  }
};

// @desc    Update room
// @route   PUT /api/rooms/:id
// @access  Private
const updateRoom = async (req, res, next) => {
  try {
    let room = await Room.findById(req.params.id);

    if (!room) {
      return errorResponse(res, 'Room not found', 404);
    }

    // Check ownership
    if (room.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 'Not authorized to update this room', 403);
    }

    room = await Room.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    successResponse(res, { room });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete room
// @route   DELETE /api/rooms/:id
// @access  Private
const deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return errorResponse(res, 'Room not found', 404);
    }

    // Check ownership
    if (room.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 'Not authorized to delete this room', 403);
    }

    await Room.findByIdAndDelete(req.params.id);

    successResponse(res, { message: 'Room deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get room templates
// @route   GET /api/rooms/templates
// @access  Private
const getTemplates = async (req, res, next) => {
  try {
    const filter = { isTemplate: true };

    if (req.query.category) {
      filter.templateCategory = req.query.category;
    }

    const rooms = await Room.find(filter)
      .populate('createdBy', 'name email')
      .sort('templateCategory');

    successResponse(res, { rooms, total: rooms.length });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRoom,
  getRooms,
  getRoom,
  updateRoom,
  deleteRoom,
  getTemplates,
};
