import { NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
export interface FileUploadOptions {
    destination?: string;
    maxFileSize?: number;
    allowedMimeTypes?: string[];
    allowedExtensions?: string[];
    imageProcessing?: {
        resize?: {
            width: number;
            height: number;
        };
        quality?: number;
        format?: 'jpeg' | 'png' | 'webp';
    };
}
export declare class FileUploadMiddleware implements NestMiddleware {
    private options;
    private upload;
    constructor(options?: FileUploadOptions);
    use(req: Request, res: Response, next: NextFunction): Promise<void>;
    private isExecutableFile;
    private isImageFile;
    private scanFile;
    private processImage;
}
export declare function createFileUploadMiddleware(options?: FileUploadOptions): FileUploadMiddleware;
