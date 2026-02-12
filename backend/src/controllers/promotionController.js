const Promotion = require('../models/Promotion');
const Service = require('../models/Service');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/sendResponse');

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
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
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


module.exports = {
  createPromotion
};
