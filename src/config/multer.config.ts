import { diskStorage } from 'multer';
import { BadRequestException } from '@nestjs/common';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

function ensureDirectoryExists(directory: string) {
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }
}

export const multerStorageConfig = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = join(__dirname, '..', '..', 'images');
      ensureDirectoryExists(uploadPath); // Ensure 'images' directory exists
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const fileExtension = file.originalname.split('.').pop();
      cb(null, `${uniqueSuffix}.${fileExtension}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter: (req, file, cb) => {
    // Allowed file types
    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new BadRequestException('Only PNG, JPG, JPEG, and WEBP files are allowed'), false);
    }

    cb(null, true); // Accept file
  },
};

export const multerTemporaryStorageConfig = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = join(__dirname, '..', '..', 'uploads');
      ensureDirectoryExists(uploadPath); // Ensure 'uploads' directory exists
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const fileExtension = file.originalname.split('.').pop();
      cb(null, `${uniqueSuffix}.${fileExtension}`);
    },
  }),

  fileFilter: (req, file, cb) => {
    // Allowed file types
    const allowedMimeTypes = ['application/pdf'];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new BadRequestException('Only PDF files are allowed'), false);
    }

    cb(null, true); // Accept file
  },
};
