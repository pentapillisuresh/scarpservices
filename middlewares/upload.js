const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Create uploads directory structure
const createUploadsDir = () => {
  const dirs = [
    './uploads',
    './uploads/scrap-images',
    './uploads/profile-images',
    './uploads/category-icons',
    './uploads/temp'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadsDir();

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/temp');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const originalName = path.basename(file.originalname, extension);
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9]/g, '-');
    cb(null, sanitizedName + '-' + uniqueSuffix + extension);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|svg|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, webp, svg, gif)'));
  }
};

// Initialize multer
const upload = multer({
  storage: storage,
  limits: { 
    fileSize: parseInt(process.env.UPLOAD_LIMIT || 10) * 1024 * 1024 // 10MB default
  },
  fileFilter: fileFilter
});

// Helper function to generate unique filename
const generateUniqueFilename = (originalName, folder) => {
  const extension = path.extname(originalName);
  const nameWithoutExt = path.basename(originalName, extension);
  const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '-');
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  return `${sanitizedName}-${timestamp}-${random}${extension}`;
};

// Image processor with local storage only
const processImage = async (file, options = {}) => {
  const { 
    width = 800, 
    height = 600, 
    quality = 80, 
    folder = 'scrap-images',
    keepOriginal = false 
  } = options;
  
  try {
    const originalFilename = path.basename(file.originalname);
    const processedFilename = `processed-${generateUniqueFilename(originalFilename, folder)}`;
    const originalFilenameUnique = `original-${generateUniqueFilename(originalFilename, folder)}`;
    
    const outputPath = path.join(`./uploads/${folder}`, processedFilename);
    const originalPath = path.join(`./uploads/${folder}`, originalFilenameUnique);
    
    // Process image with Sharp
    await sharp(file.path)
      .resize(width, height, { 
        fit: 'inside', 
        withoutEnlargement: true 
      })
      .jpeg({ 
        quality: quality,
        mozjpeg: true 
      })
      .toFile(outputPath);
    
    // Keep original if requested (for profile images, etc.)
    if (keepOriginal) {
      fs.copyFileSync(file.path, originalPath);
    }
    
    // Delete temp file
    fs.unlinkSync(file.path);
    
    return {
      url: `/uploads/${folder}/${processedFilename}`,
      path: outputPath,
      filename: processedFilename,
      originalUrl: keepOriginal ? `/uploads/${folder}/${originalFilenameUnique}` : null,
      size: fs.statSync(outputPath).size,
      format: 'jpeg'
    };
  } catch (error) {
    // Clean up temp file on error
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    throw error;
  }
};

// Processor for scrap images
const processScrapImage = async (file) => {
  return processImage(file, {
    width: 800,
    height: 600,
    quality: 80,
    folder: 'scrap-images',
    keepOriginal: false
  });
};

// Processor for profile images (keep original)
const processProfileImage = async (file) => {
  return processImage(file, {
    width: 400,
    height: 400,
    quality: 90,
    folder: 'profile-images',
    keepOriginal: true
  });
};

// Processor for category icons (square, smaller)
const processCategoryIcon = async (file) => {
  return processImage(file, {
    width: 150,
    height: 150,
    quality: 90,
    folder: 'category-icons',
    keepOriginal: false
  });
};

// SVG processor (no resizing, just move)
const processSVG = async (file, folder) => {
  try {
    const originalFilename = path.basename(file.originalname);
    const uniqueFilename = generateUniqueFilename(originalFilename, folder);
    const outputPath = path.join(`./uploads/${folder}`, uniqueFilename);
    
    // Move file directly (no processing for SVG)
    fs.renameSync(file.path, outputPath);
    
    return {
      url: `/uploads/${folder}/${uniqueFilename}`,
      path: outputPath,
      filename: uniqueFilename,
      format: 'svg'
    };
  } catch (error) {
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    throw error;
  }
};

// Smart processor that detects file type
const processUploadedFile = async (file, type = 'scrap') => {
  const extension = path.extname(file.originalname).toLowerCase();
  
  // Handle SVG separately (no resizing)
  if (extension === '.svg') {
    switch (type) {
      case 'profile':
        return processSVG(file, 'profile-images');
      case 'category':
        return processSVG(file, 'category-icons');
      default:
        return processSVG(file, 'scrap-images');
    }
  }
  
  // Handle other image types with processing
  switch (type) {
    case 'profile':
      return processProfileImage(file);
    case 'category':
      return processCategoryIcon(file);
    default:
      return processScrapImage(file);
  }
};

// Multiple file upload middleware for scrap images
const uploadScrapImages = upload.array('images', 10);

// Single file upload for profile image
const uploadProfileImage = upload.single('profile_image');

// Single file upload for category icon
const uploadCategoryIcon = upload.single('icon');

// Generic upload middleware
const uploadAnyImage = upload.single('image');

module.exports = {
  uploadScrapImages,
  uploadProfileImage,
  uploadCategoryIcon,
  uploadAnyImage,
  processImage,
  processProfileImage,
  processCategoryIcon,
  processScrapImage,
  processUploadedFile,
  generateUniqueFilename
};