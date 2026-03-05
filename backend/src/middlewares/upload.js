const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const AppError = require('../utils/AppError');
const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET
} = require('../config/env');

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET
});

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'Invalid file type. Only JPEG, JPG, PNG, GIF, and WEBP images are allowed.',
        400
      ),
      false
    );
  }
};

// Tạo Cloudinary storage cho từng loại upload
const createCloudinaryStorage = (folder) => {
  return new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `barberly/${folder}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      transformation: [{ quality: 'auto', fetch_format: 'auto' }]
    }
  });
};

const createUploader = (folder) => {
  return multer({
    storage: createCloudinaryStorage(folder),
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter
  });
};


const uploadSingle = (fieldName, type = 'avatars') => {
  const upload = createUploader(type);
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new AppError('File size too large. Maximum size is 5MB.', 400));
          }
          return next(new AppError(`Upload error: ${err.message}`, 400));
        }
        return next(err);
      }

      if (req.file) {
        // Cloudinary trả về URL trong req.file.path
        req.file.url = req.file.path;
      }

      next();
    });
  };
};

const uploadMultiple = (fieldName, maxCount = 10, type = 'shop') => {
  const upload = createUploader(type);
  return (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new AppError('File size too large. Maximum size is 5MB.', 400));
          }
          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return next(new AppError(`Too many files. Maximum is ${maxCount}.`, 400));
          }
          return next(new AppError(`Upload error: ${err.message}`, 400));
        }
        return next(err);
      }

      if (req.files && req.files.length > 0) {
        req.files = req.files.map((file) => ({
          ...file,
          url: file.path
        }));
      }

      next();
    });
  };
};
