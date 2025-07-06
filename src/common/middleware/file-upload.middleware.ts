import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import * as multer from 'multer';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as sharp from 'sharp';
import { promises as fs } from 'fs';

export interface FileUploadOptions {
  destination?: string;
  maxFileSize?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  imageProcessing?: {
    resize?: { width: number; height: number };
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
  };
}

@Injectable()
export class FileUploadMiddleware implements NestMiddleware {
  private upload: multer.Multer;

  constructor(private options: FileUploadOptions = {}) {
    const {
      destination = './uploads',
      maxFileSize = 5 * 1024 * 1024, // 5MB default
      allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
      allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf'],
    } = options;

    this.upload = multer({
      storage: diskStorage({
        destination: async (req, file, cb) => {
          // Create directory if it doesn't exist
          await fs.mkdir(destination, { recursive: true });
          cb(null, destination);
        },
        filename: (req, file, cb) => {
          // Generate unique filename
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      fileFilter: (req, file, cb) => {
        // Validate file type
        const ext = extname(file.originalname).toLowerCase();

        if (!allowedExtensions.includes(ext)) {
          return cb(new BadRequestException(`File extension ${ext} is not allowed`));
        }

        if (!allowedMimeTypes.includes(file.mimetype)) {
          return cb(new BadRequestException(`File type ${file.mimetype} is not allowed`));
        }

        // Additional security check for file content
        if (this.isExecutableFile(file.originalname)) {
          return cb(new BadRequestException('Executable files are not allowed'));
        }

        cb(null, true);
      },
      limits: {
        fileSize: maxFileSize,
        files: 10, // Maximum 10 files per request
      },
    });
  }

  async use(req: Request, res: Response, next: NextFunction) {
    this.upload.any()(req, res, async (err: any) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new BadRequestException('File size too large'));
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return next(new BadRequestException('Too many files'));
          }
        }
        return next(err);
      }

      // Process uploaded files
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          try {
            // Scan file for malware (integrate with ClamAV or similar)
            await this.scanFile(file.path);

            // Process images if configured
            if (this.isImageFile(file.mimetype) && this.options.imageProcessing) {
              await this.processImage(file);
            }

            // Add file metadata
            (file as any).securityChecked = true;
            (file as any).uploadedAt = new Date();
          } catch (error) {
            // Remove file if processing fails
            await fs.unlink(file.path).catch(() => {});
            return next(new BadRequestException(`File processing failed: ${error.message}`));
          }
        }
      }

      next();
    });
  }

  private isExecutableFile(filename: string): boolean {
    const dangerousExtensions = [
      '.exe',
      '.bat',
      '.cmd',
      '.com',
      '.pif',
      '.scr',
      '.vbs',
      '.js',
      '.jar',
      '.app',
      '.dmg',
      '.pkg',
      '.deb',
      '.rpm',
      '.msi',
      '.sh',
      '.bash',
      '.ps1',
      '.psm1',
      '.psd1',
      '.ps1xml',
      '.psc1',
      '.msh',
      '.msh1',
      '.msh2',
      '.mshxml',
      '.msh1xml',
      '.msh2xml',
      '.scf',
      '.lnk',
      '.inf',
      '.reg',
      '.dll',
      '.so',
      '.dylib',
    ];

    const ext = extname(filename).toLowerCase();
    return dangerousExtensions.includes(ext);
  }

  private isImageFile(mimetype: string): boolean {
    return mimetype.startsWith('image/');
  }

  private async scanFile(filePath: string): Promise<void> {
    // Implement virus scanning here
    // Example: integrate with ClamAV
    // const clamscan = new NodeClam();
    // const { isInfected } = await clamscan.scanFile(filePath);
    // if (isInfected) {
    //   throw new Error('File contains malware');
    // }

    // For now, just check file magic numbers
    const buffer = await fs.readFile(filePath, { encoding: null });
    const fileSignature = buffer.toString('hex', 0, 4);

    // Check for common file signatures
    const signatures: Record<string, string[]> = {
      jpeg: ['ffd8ffe0', 'ffd8ffe1', 'ffd8ffe2'],
      png: ['89504e47'],
      gif: ['47494638'],
      pdf: ['25504446'],
    };

    let validSignature = false;
    for (const [type, sigs] of Object.entries(signatures)) {
      if (sigs.some((sig) => fileSignature.startsWith(sig))) {
        validSignature = true;
        break;
      }
    }

    if (!validSignature) {
      throw new Error('Invalid file signature');
    }
  }

  private async processImage(file: Express.Multer.File): Promise<void> {
    const { imageProcessing } = this.options;
    if (!imageProcessing) return;

    const processedPath = file.path.replace(extname(file.path), `-processed${extname(file.path)}`);

    try {
      let pipeline = sharp(file.path);

      // Resize if configured
      if (imageProcessing.resize) {
        pipeline = pipeline.resize(imageProcessing.resize.width, imageProcessing.resize.height, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      // Set quality
      if (imageProcessing.quality) {
        pipeline = pipeline.jpeg({ quality: imageProcessing.quality });
      }

      // Convert format if specified
      if (imageProcessing.format) {
        pipeline = pipeline.toFormat(imageProcessing.format);
      }

      // Remove metadata for privacy
      pipeline = pipeline.withMetadata();

      // Save processed image
      await pipeline.toFile(processedPath);

      // Replace original with processed
      await fs.unlink(file.path);
      await fs.rename(processedPath, file.path);

      // Update file info
      const stats = await fs.stat(file.path);
      file.size = stats.size;
    } catch (error) {
      // Clean up on error
      await fs.unlink(processedPath).catch(() => {});
      throw error;
    }
  }
}

// Factory function for creating file upload middleware
export function createFileUploadMiddleware(options?: FileUploadOptions) {
  return new FileUploadMiddleware(options);
}
