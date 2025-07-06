"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUploadMiddleware = void 0;
exports.createFileUploadMiddleware = createFileUploadMiddleware;
const common_1 = require("@nestjs/common");
const multer = require("multer");
const multer_1 = require("multer");
const path_1 = require("path");
const uuid_1 = require("uuid");
const sharp = require("sharp");
const fs_1 = require("fs");
let FileUploadMiddleware = class FileUploadMiddleware {
    constructor(options = {}) {
        this.options = options;
        const { destination = './uploads', maxFileSize = 5 * 1024 * 1024, allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'], allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf'], } = options;
        this.upload = multer({
            storage: (0, multer_1.diskStorage)({
                destination: async (req, file, cb) => {
                    await fs_1.promises.mkdir(destination, { recursive: true });
                    cb(null, destination);
                },
                filename: (req, file, cb) => {
                    const uniqueName = `${(0, uuid_1.v4)()}${(0, path_1.extname)(file.originalname)}`;
                    cb(null, uniqueName);
                },
            }),
            fileFilter: (req, file, cb) => {
                const ext = (0, path_1.extname)(file.originalname).toLowerCase();
                if (!allowedExtensions.includes(ext)) {
                    return cb(new common_1.BadRequestException(`File extension ${ext} is not allowed`));
                }
                if (!allowedMimeTypes.includes(file.mimetype)) {
                    return cb(new common_1.BadRequestException(`File type ${file.mimetype} is not allowed`));
                }
                if (this.isExecutableFile(file.originalname)) {
                    return cb(new common_1.BadRequestException('Executable files are not allowed'));
                }
                cb(null, true);
            },
            limits: {
                fileSize: maxFileSize,
                files: 10,
            },
        });
    }
    async use(req, res, next) {
        this.upload.any()(req, res, async (err) => {
            if (err) {
                if (err instanceof multer.MulterError) {
                    if (err.code === 'LIMIT_FILE_SIZE') {
                        return next(new common_1.BadRequestException('File size too large'));
                    }
                    if (err.code === 'LIMIT_FILE_COUNT') {
                        return next(new common_1.BadRequestException('Too many files'));
                    }
                }
                return next(err);
            }
            if (req.files && Array.isArray(req.files)) {
                for (const file of req.files) {
                    try {
                        await this.scanFile(file.path);
                        if (this.isImageFile(file.mimetype) && this.options.imageProcessing) {
                            await this.processImage(file);
                        }
                        file.securityChecked = true;
                        file.uploadedAt = new Date();
                    }
                    catch (error) {
                        await fs_1.promises.unlink(file.path).catch(() => { });
                        return next(new common_1.BadRequestException(`File processing failed: ${error.message}`));
                    }
                }
            }
            next();
        });
    }
    isExecutableFile(filename) {
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
        const ext = (0, path_1.extname)(filename).toLowerCase();
        return dangerousExtensions.includes(ext);
    }
    isImageFile(mimetype) {
        return mimetype.startsWith('image/');
    }
    async scanFile(filePath) {
        const buffer = await fs_1.promises.readFile(filePath, { encoding: null });
        const fileSignature = buffer.toString('hex', 0, 4);
        const signatures = {
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
    async processImage(file) {
        const { imageProcessing } = this.options;
        if (!imageProcessing)
            return;
        const processedPath = file.path.replace((0, path_1.extname)(file.path), `-processed${(0, path_1.extname)(file.path)}`);
        try {
            let pipeline = sharp(file.path);
            if (imageProcessing.resize) {
                pipeline = pipeline.resize(imageProcessing.resize.width, imageProcessing.resize.height, {
                    fit: 'inside',
                    withoutEnlargement: true,
                });
            }
            if (imageProcessing.quality) {
                pipeline = pipeline.jpeg({ quality: imageProcessing.quality });
            }
            if (imageProcessing.format) {
                pipeline = pipeline.toFormat(imageProcessing.format);
            }
            pipeline = pipeline.withMetadata();
            await pipeline.toFile(processedPath);
            await fs_1.promises.unlink(file.path);
            await fs_1.promises.rename(processedPath, file.path);
            const stats = await fs_1.promises.stat(file.path);
            file.size = stats.size;
        }
        catch (error) {
            await fs_1.promises.unlink(processedPath).catch(() => { });
            throw error;
        }
    }
};
exports.FileUploadMiddleware = FileUploadMiddleware;
exports.FileUploadMiddleware = FileUploadMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object])
], FileUploadMiddleware);
function createFileUploadMiddleware(options) {
    return new FileUploadMiddleware(options);
}
//# sourceMappingURL=file-upload.middleware.js.map