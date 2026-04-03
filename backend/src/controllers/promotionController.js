const Promotion = require('../models/Promotion');
const Service = require('../models/Service');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/sendResponse');

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const createPromotion = async (req, res, next) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      usageLimit,
      startDate,
      endDate,
      isActive,
      applicableServices
    } = req.body;

    const existingPromotion = await Promotion.findOne({
      code: code.toUpperCase()
    });

    if (existingPromotion) {
      return next(new AppError('Promotion code already exists', 400));
    }

    if (applicableServices && applicableServices.length > 0) {
      const services = await Service.find({
        _id: { $in: applicableServices }
      });

      if (services.length !== applicableServices.length) {
        return next(new AppError('One or more service IDs are invalid', 400));
      }
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return next(new AppError('End date must be after start date', 400));
    }

    if (discountType === 'percentage' && discountValue > 100) {
      return next(new AppError('Percentage discount cannot exceed 100%', 400));
    }

    const promotion = await Promotion.create({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      minOrderAmount: minOrderAmount || 0,
      maxDiscount,
      usageLimit,
      startDate: start,
      endDate: end,
      isActive: isActive !== undefined ? isActive : true,
      applicableServices: applicableServices || []
    });

    await promotion.populate('applicableServices', 'name price');

    sendResponse(res, 201, { promotion }, 'Promotion created successfully');
  } catch (error) {
    next(error);
  }
};

const getPromotions = async (req, res, next) => {
  try {
    const { isActive, page = 1, limit = 10, search } = req.query;

    const query = {};

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { code: { $regex: safeSearch, $options: 'i' } },
        { description: { $regex: safeSearch, $options: 'i' } }
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const promotions = await Promotion.find(query)
      .populate('applicableServices', 'name price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Promotion.countDocuments(query);

    sendResponse(
      res,
      200,
      {
        promotions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      },
      'Promotions retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

const getPromotionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const promotion = await Promotion.findById(id).populate(
      'applicableServices',
      'name price duration'
    );

    if (!promotion) {
      return next(new AppError('Promotion not found', 404));
    }

    sendResponse(res, 200, { promotion }, 'Promotion retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updatePromotion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      usageLimit,
      startDate,
      endDate,
      isActive,
      applicableServices
    } = req.body;

    const promotion = await Promotion.findById(id);

    if (!promotion) {
      return next(new AppError('Promotion not found', 404));
    }

    if (code && code.toUpperCase() !== promotion.code) {
      const existingPromotion = await Promotion.findOne({
        code: code.toUpperCase(),
        _id: { $ne: id }
      });

      if (existingPromotion) {
        return next(new AppError('Promotion code already exists', 400));
      }
    }

    if (applicableServices && applicableServices.length > 0) {
      const services = await Service.find({
        _id: { $in: applicableServices }
      });

      if (services.length !== applicableServices.length) {
        return next(new AppError('One or more service IDs are invalid', 400));
      }
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start >= end) {
        return next(new AppError('End date must be after start date', 400));
      }
    }

    const newDiscountType = discountType || promotion.discountType;
    const newDiscountValue = discountValue !== undefined ? discountValue : promotion.discountValue;

    if (newDiscountType === 'percentage' && newDiscountValue > 100) {
      return next(new AppError('Percentage discount cannot exceed 100%', 400));
    }

    if (code) promotion.code = code.toUpperCase();
    if (description !== undefined) promotion.description = description;
    if (discountType) promotion.discountType = discountType;
    if (discountValue !== undefined) promotion.discountValue = discountValue;
    if (minOrderAmount !== undefined) promotion.minOrderAmount = minOrderAmount;
    if (maxDiscount !== undefined) promotion.maxDiscount = maxDiscount;
    if (usageLimit !== undefined) promotion.usageLimit = usageLimit;
    if (startDate) promotion.startDate = new Date(startDate);
    if (endDate) promotion.endDate = new Date(endDate);
    if (isActive !== undefined) promotion.isActive = isActive;
    if (applicableServices !== undefined) promotion.applicableServices = applicableServices;

    await promotion.save();

    await promotion.populate('applicableServices', 'name price');

    sendResponse(res, 200, { promotion }, 'Promotion updated successfully');
  } catch (error) {
    next(error);
  }
};

const deletePromotion = async (req, res, next) => {
  try {
    const { id } = req.params;

    const promotion = await Promotion.findById(id);

    if (!promotion) {
      return next(new AppError('Promotion not found', 404));
    }

    await Promotion.findByIdAndDelete(id);

    sendResponse(res, 200, null, 'Promotion deleted successfully');
  } catch (error) {
    next(error);
  }
};

const togglePromotionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const promotion = await Promotion.findById(id);

    if (!promotion) {
      return next(new AppError('Promotion not found', 404));
    }

    promotion.isActive = !promotion.isActive;
    await promotion.save();

    await promotion.populate('applicableServices', 'name price');

    sendResponse(
      res,
      200,
      { promotion },
      `Promotion ${promotion.isActive ? 'activated' : 'deactivated'} successfully`
    );
  } catch (error) {
    next(error);
  }
};

const applyPromotion = async (req, res, next) => {
  try {
    const { code, orderAmount, serviceIds } = req.body;

    const promotion = await Promotion.findOne({
      code: code.toUpperCase()
    }).populate('applicableServices', 'name');

    if (!promotion) {
      return next(new AppError('Invalid promotion code', 404));
    }

    const validationResult = promotion.isValid();

    if (!validationResult.valid) {
      return next(new AppError(validationResult.message, 400));
    }

    if (orderAmount < promotion.minOrderAmount) {
      return next(
        new AppError(
          `Minimum order amount for this promotion is ${promotion.minOrderAmount.toLocaleString('vi-VN')} VND`,
          400
        )
      );
    }

    if (promotion.applicableServices && promotion.applicableServices.length > 0) {
      if (!serviceIds || serviceIds.length === 0) {
        return next(new AppError('Service IDs are required for this promotion', 400));
      }

      const applicableServiceIds = promotion.applicableServices.map((s) => s._id.toString());
      const hasApplicableService = serviceIds.some((sid) =>
        applicableServiceIds.includes(sid.toString())
      );

      if (!hasApplicableService) {
        const serviceNames = promotion.applicableServices.map((s) => s.name).join(', ');
        return next(
          new AppError(`This promotion is only applicable for: ${serviceNames}`, 400)
        );
      }
    }

    const discountResult = promotion.calculateDiscount(orderAmount);

    if (discountResult.discount === 0 && discountResult.message) {
      return next(new AppError(discountResult.message, 400));
    }

    // Tăng usedCount khi apply thành công
    promotion.usedCount += 1;
    await promotion.save();

    sendResponse(
      res,
      200,
      {
        valid: true,
        code: promotion.code,
        discountType: promotion.discountType,
        discountValue: promotion.discountValue,
        discount: discountResult.discount,
        finalAmount: discountResult.finalAmount,
        promotion: {
          _id: promotion._id,
          code: promotion.code,
          description: promotion.description
        }
      },
      'Promotion applied successfully'
    );
  } catch (error) {
    next(error);
  }
};

const validatePromotion = async (req, res, next) => {
  try {
    const { code } = req.params;

    const promotion = await Promotion.findOne({
      code: code.toUpperCase()
    }).populate('applicableServices', 'name price');

    if (!promotion) {
      return next(new AppError('Invalid promotion code', 404));
    }

    const validationResult = promotion.isValid();

    sendResponse(
      res,
      200,
      {
        valid: validationResult.valid,
        message: validationResult.message,
        promotion: validationResult.valid
          ? {
              _id: promotion._id,
              code: promotion.code,
              description: promotion.description,
              discountType: promotion.discountType,
              discountValue: promotion.discountValue,
              minOrderAmount: promotion.minOrderAmount,
              maxDiscount: promotion.maxDiscount,
              startDate: promotion.startDate,
              endDate: promotion.endDate,
              applicableServices: promotion.applicableServices
            }
          : null
      },
      validationResult.valid ? 'Promotion code is valid' : validationResult.message
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPromotion,
  getPromotions,
  getPromotionById,
  updatePromotion,
  deletePromotion,
  togglePromotionStatus,
  applyPromotion,
  validatePromotion
};
