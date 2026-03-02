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

const updateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, price, duration, category, isActive } = req.body;

    const service = await Service.findById(id);

    if (!service) {
      if (req.file) {
        await deleteFile(req.file.url);
      }
      return next(new AppError('Service not found', 404));
    }

    if (name !== undefined) service.name = name;
    if (description !== undefined) service.description = description;
    if (price !== undefined) service.price = price;
    if (duration !== undefined) service.duration = duration;
    if (category !== undefined) service.category = category;
    if (isActive !== undefined) service.isActive = isActive;

    if (req.file) {
      if (service.image) {
        await deleteFile(service.image);
      }
      service.image = req.file.url;
    }

    await service.save();

    sendResponse(res, 200, { service }, 'Service updated successfully');
  } catch (error) {
    if (req.file) {
      await deleteFile(req.file.url);
    }
    next(error);
  }
};

const toggleServiceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id);

    if (!service) {
      return next(new AppError('Service not found', 404));
    }

    service.isActive = !service.isActive;
    await service.save();

    sendResponse(
      res,
      200,
      { service: { _id: service._id, isActive: service.isActive } },
      `Service ${service.isActive ? 'activated' : 'deactivated'} successfully`
    );
  } catch (error) {
    next(error);
  }
};

const deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id);

    if (!service) {
      return next(new AppError('Service not found', 404));
    }

    if (service.image) {
      await deleteFile(service.image);
    }

    await Service.findByIdAndDelete(id);

    sendResponse(res, 200, null, 'Service deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActiveServices,
  getAllServices,
  getServiceById,
  createService,
  updateService,
  toggleServiceStatus,
  deleteService
};
