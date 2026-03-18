const Furniture = require('../models/Furniture');
const { successResponse, errorResponse, paginate } = require('../utils/helpers');

// @desc    Create a new furniture item
// @route   POST /api/furniture
// @access  Private/Admin
const createFurniture = async (req, res, next) => {
  try {
    const furniture = await Furniture.create(req.body);
    successResponse(res, { furniture }, 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all furniture
// @route   GET /api/furniture
// @access  Private
const getFurniture = async (req, res, next) => {
  try {
    const { skip, limit, page } = paginate(req.query.page, req.query.limit);

    const filter = {};

    // Filter by category
    if (req.query.category) {
      filter.category = req.query.category;
    }

    // Search by name
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: 'i' };
    }

    const total = await Furniture.countDocuments(filter);
    const furniture = await Furniture.find(filter)
      .skip(skip)
      .limit(limit)
      .sort('category name');

    successResponse(res, {
      furniture,
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

// @desc    Get single furniture item
// @route   GET /api/furniture/:id
// @access  Private
const getFurnitureById = async (req, res, next) => {
  try {
    const furniture = await Furniture.findById(req.params.id);

    if (!furniture) {
      return errorResponse(res, 'Furniture not found', 404);
    }

    successResponse(res, { furniture });
  } catch (error) {
    next(error);
  }
};

// @desc    Update furniture item
// @route   PUT /api/furniture/:id
// @access  Private/Admin
const updateFurniture = async (req, res, next) => {
  try {
    const furniture = await Furniture.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!furniture) {
      return errorResponse(res, 'Furniture not found', 404);
    }

    successResponse(res, { furniture });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete furniture item
// @route   DELETE /api/furniture/:id
// @access  Private/Admin
const deleteFurniture = async (req, res, next) => {
  try {
    const furniture = await Furniture.findById(req.params.id);

    if (!furniture) {
      return errorResponse(res, 'Furniture not found', 404);
    }

    await Furniture.findByIdAndDelete(req.params.id);

    successResponse(res, { message: 'Furniture deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get furniture categories
// @route   GET /api/furniture/categories
// @access  Private
const getCategories = async (req, res, next) => {
  try {
    const categories = await Furniture.distinct('category');
    const categoryCounts = await Furniture.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    successResponse(res, { categories, categoryCounts });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFurniture,
  getFurniture,
  getFurnitureById,
  updateFurniture,
  deleteFurniture,
  getCategories,
};
