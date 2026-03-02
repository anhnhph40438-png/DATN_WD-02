const Service = require('../models/Service');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/sendResponse');
const { deleteFile } = require('../middlewares/upload');

const getActiveServices = async (req, res, next) => {
  try {
    const { category, minPrice, maxPrice } = req.query;

    const query = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) {
        query.price.$gte = parseFloat(minPrice);
      }
      if (maxPrice !== undefined) {
        query.price.$lte = parseFloat(maxPrice);
      }
    }

    const services = await Service.find(query).sort({ category: 1, name: 1 });

    sendResponse(res, 200, { services }, 'Services retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getAllServices = async (req, res, next) => {
  try {
    const { category, minPrice, maxPrice, isActive } = req.query;

    const query = {};

    if (category) {
      query.category = category;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) {
        query.price.$gte = parseFloat(minPrice);
      }
      if (maxPrice !== undefined) {
        query.price.$lte = parseFloat(maxPrice);
      }
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const services = await Service.find(query).sort({ category: 1, name: 1 });

    sendResponse(res, 200, { services }, 'All services retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getServiceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id);

    if (!service) {
      return next(new AppError('Service not found', 404));
    }

    sendResponse(res, 200, { service }, 'Service retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createService = async (req, res, next) => {
  try {
    const { name, description, price, duration, category } = req.body;

    const service = await Service.create({
      name,
      description,
      price,
      duration,
      category,
      image: req.file ? req.file.url : undefined
    });

    sendResponse(res, 201, { service }, 'Service created successfully');
  } catch (error) {
    if (req.file) {
      await deleteFile(req.file.url);
    }
    next(error);
  }
};