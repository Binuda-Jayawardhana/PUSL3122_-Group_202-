const Design = require('../models/Design');
const Room = require('../models/Room');
const { successResponse, errorResponse, paginate } = require('../utils/helpers');

// @desc    Create a new design
// @route   POST /api/designs
// @access  Private
const createDesign = async (req, res, next) => {
  try {
    req.body.createdBy = req.user._id;

    // Verify room exists
    const room = await Room.findById(req.body.room);
    if (!room) {
      return errorResponse(res, 'Room not found', 404);
    }

    const design = await Design.create(req.body);
    const populatedDesign = await Design.findById(design._id)
      .populate('room')
      .populate('furnitureItems.furniture')
      .populate('createdBy', 'name email');

    successResponse(res, { design: populatedDesign }, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all designs for current user
// @route   GET /api/designs
// @access  Private
const getDesigns = async (req, res, next) => {
  try {
    const { skip, limit, page } = paginate(req.query.page, req.query.limit);

    const filter = {};

    // Admin can see all designs, users see their own
    if (req.user.role !== 'admin') {
      filter.createdBy = req.user._id;
    }

    const total = await Design.countDocuments(filter);
    const designs = await Design.find(filter)
      .populate('room', 'name width height depth shape wallColor')
      .populate('createdBy', 'name email')
      .skip(skip)
      .limit(limit)
      .sort('-updatedAt');

    successResponse(res, {
      designs,
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

// @desc    Get single design with full data
// @route   GET /api/designs/:id
// @access  Private
const getDesign = async (req, res, next) => {
  try {
    const design = await Design.findById(req.params.id)
      .populate('room')
      .populate('furnitureItems.furniture')
      .populate('createdBy', 'name email');

    if (!design) {
      return errorResponse(res, 'Design not found', 404);
    }

    // Check ownership
    if (design.createdBy._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 'Not authorized to access this design', 403);
    }

    successResponse(res, { design });
  } catch (error) {
    next(error);
  }
};

// @desc    Update design (add/move furniture, change properties)
// @route   PUT /api/designs/:id
// @access  Private
const updateDesign = async (req, res, next) => {
  try {
    let design = await Design.findById(req.params.id);

    if (!design) {
      return errorResponse(res, 'Design not found', 404);
    }

    // Check ownership
    if (design.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 'Not authorized to update this design', 403);
    }

    design = await Design.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('room')
      .populate('furnitureItems.furniture')
      .populate('createdBy', 'name email');

    successResponse(res, { design });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete design
// @route   DELETE /api/designs/:id
// @access  Private
const deleteDesign = async (req, res, next) => {
  try {
    const design = await Design.findById(req.params.id);

    if (!design) {
      return errorResponse(res, 'Design not found', 404);
    }

    // Check ownership
    if (design.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 'Not authorized to delete this design', 403);
    }

    await Design.findByIdAndDelete(req.params.id);

    successResponse(res, { message: 'Design deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Add furniture to design
// @route   POST /api/designs/:id/furniture
// @access  Private
const addFurniture = async (req, res, next) => {
  try {
    const design = await Design.findById(req.params.id);

    if (!design) {
      return errorResponse(res, 'Design not found', 404);
    }

    // Check ownership
    if (design.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 'Not authorized to modify this design', 403);
    }

    const { furniture, x, y, z, rotation, scaleX, scaleY, scaleZ, color } = req.body;

    design.furnitureItems.push({
      furniture,
      x: x || 0,
      y: y || 0,
      z: z || 0,
      rotation: rotation || 0,
      scaleX: scaleX || 1,
      scaleY: scaleY || 1,
      scaleZ: scaleZ || 1,
      color: color || '',
    });

    await design.save();

    const populatedDesign = await Design.findById(design._id)
      .populate('room')
      .populate('furnitureItems.furniture')
      .populate('createdBy', 'name email');

    successResponse(res, { design: populatedDesign });
  } catch (error) {
    next(error);
  }
};

// @desc    Update furniture position/properties in design
// @route   PUT /api/designs/:id/furniture/:itemId
// @access  Private
const updateFurnitureInDesign = async (req, res, next) => {
  try {
    const design = await Design.findById(req.params.id);

    if (!design) {
      return errorResponse(res, 'Design not found', 404);
    }

    // Check ownership
    if (design.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 'Not authorized to modify this design', 403);
    }

    const itemIndex = design.furnitureItems.findIndex(
      (item) => item._id.toString() === req.params.itemId
    );

    if (itemIndex === -1) {
      return errorResponse(res, 'Furniture item not found in design', 404);
    }

    // Update the furniture item properties
    const updatableFields = ['x', 'y', 'z', 'rotation', 'rotationX', 'rotationY', 'rotationZ', 'scaleX', 'scaleY', 'scaleZ', 'color', 'locked'];
    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        design.furnitureItems[itemIndex][field] = req.body[field];
      }
    });

    // Update shading if provided
    if (req.body.shading) {
      if (req.body.shading.intensity !== undefined) {
        design.furnitureItems[itemIndex].shading.intensity = req.body.shading.intensity;
      }
      if (req.body.shading.type) {
        design.furnitureItems[itemIndex].shading.type = req.body.shading.type;
      }
    }

    await design.save();

    const populatedDesign = await Design.findById(design._id)
      .populate('room')
      .populate('furnitureItems.furniture')
      .populate('createdBy', 'name email');

    successResponse(res, { design: populatedDesign });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove furniture from design
// @route   DELETE /api/designs/:id/furniture/:itemId
// @access  Private
const removeFurnitureFromDesign = async (req, res, next) => {
  try {
    const design = await Design.findById(req.params.id);

    if (!design) {
      return errorResponse(res, 'Design not found', 404);
    }

    // Check ownership
    if (design.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 'Not authorized to modify this design', 403);
    }

    design.furnitureItems = design.furnitureItems.filter(
      (item) => item._id.toString() !== req.params.itemId
    );

    await design.save();

    const populatedDesign = await Design.findById(design._id)
      .populate('room')
      .populate('furnitureItems.furniture')
      .populate('createdBy', 'name email');

    successResponse(res, { design: populatedDesign });
  } catch (error) {
    next(error);
  }
};

// @desc    Scale design to fit room
// @route   PUT /api/designs/:id/scale
// @access  Private
const scaleDesign = async (req, res, next) => {
  try {
    const design = await Design.findById(req.params.id).populate('room').populate('furnitureItems.furniture');

    if (!design) {
      return errorResponse(res, 'Design not found', 404);
    }

    // Check ownership
    if (design.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 'Not authorized to modify this design', 403);
    }

    const room = design.room;
    const { scaleFactor } = req.body;

    if (scaleFactor) {
      // Manual scale factor provided
      design.furnitureItems.forEach((item) => {
        item.scaleX *= scaleFactor;
        item.scaleY *= scaleFactor;
        item.scaleZ *= scaleFactor;
        item.x *= scaleFactor;
        item.y *= scaleFactor;
        item.z *= scaleFactor;
      });
    } else {
      // Auto-fit: calculate bounding box and scale to fit room
      if (design.furnitureItems.length > 0) {
        let maxX = 0, maxZ = 0;

        design.furnitureItems.forEach((item) => {
          const fw = item.furniture ? item.furniture.dimensions.width * item.scaleX : 1;
          const fd = item.furniture ? item.furniture.dimensions.depth * item.scaleZ : 1;
          const itemMaxX = item.x + fw;
          const itemMaxZ = item.z + fd;
          if (itemMaxX > maxX) maxX = itemMaxX;
          if (itemMaxZ > maxZ) maxZ = itemMaxZ;
        });

        const scaleX = maxX > 0 ? (room.width * 0.9) / maxX : 1;
        const scaleZ = maxZ > 0 ? (room.depth * 0.9) / maxZ : 1;
        const autoScale = Math.min(scaleX, scaleZ, 1); // Don't scale up, only down

        design.furnitureItems.forEach((item) => {
          item.scaleX *= autoScale;
          item.scaleY *= autoScale;
          item.scaleZ *= autoScale;
          item.x *= autoScale;
          item.z *= autoScale;
        });
      }
    }

    await design.save();

    const populatedDesign = await Design.findById(design._id)
      .populate('room')
      .populate('furnitureItems.furniture')
      .populate('createdBy', 'name email');

    successResponse(res, { design: populatedDesign });
  } catch (error) {
    next(error);
  }
};

// @desc    Apply shading to design (whole or selected parts)
// @route   PUT /api/designs/:id/shade
// @access  Private
const shadeDesign = async (req, res, next) => {
  try {
    const design = await Design.findById(req.params.id);

    if (!design) {
      return errorResponse(res, 'Design not found', 404);
    }

    // Check ownership
    if (design.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 'Not authorized to modify this design', 403);
    }

    const { intensity, type, itemIds } = req.body;

    if (itemIds && itemIds.length > 0) {
      // Apply shading to selected items only
      design.furnitureItems.forEach((item) => {
        if (itemIds.includes(item._id.toString())) {
          if (intensity !== undefined) item.shading.intensity = intensity;
          if (type) item.shading.type = type;
        }
      });
    } else {
      // Apply shading to entire design
      if (intensity !== undefined) design.globalShading.intensity = intensity;
      if (type) design.globalShading.type = type;

      // Also apply to all furniture items
      design.furnitureItems.forEach((item) => {
        if (intensity !== undefined) item.shading.intensity = intensity;
        if (type) item.shading.type = type;
      });
    }

    await design.save();

    const populatedDesign = await Design.findById(design._id)
      .populate('room')
      .populate('furnitureItems.furniture')
      .populate('createdBy', 'name email');

    successResponse(res, { design: populatedDesign });
  } catch (error) {
    next(error);
  }
};

// @desc    Change color of design (whole or selected parts)
// @route   PUT /api/designs/:id/color
// @access  Private
const colorDesign = async (req, res, next) => {
  try {
    const design = await Design.findById(req.params.id);

    if (!design) {
      return errorResponse(res, 'Design not found', 404);
    }

    // Check ownership
    if (design.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 'Not authorized to modify this design', 403);
    }

    const { color, itemIds } = req.body;

    if (!color) {
      return errorResponse(res, 'Please provide a color', 400);
    }

    if (itemIds && itemIds.length > 0) {
      // Apply color to selected items only
      design.furnitureItems.forEach((item) => {
        if (itemIds.includes(item._id.toString())) {
          item.color = color;
        }
      });
    } else {
      // Apply color to entire design
      design.globalColor = color;
      design.furnitureItems.forEach((item) => {
        item.color = color;
      });
    }

    await design.save();

    const populatedDesign = await Design.findById(design._id)
      .populate('room')
      .populate('furnitureItems.furniture')
      .populate('createdBy', 'name email');

    successResponse(res, { design: populatedDesign });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
