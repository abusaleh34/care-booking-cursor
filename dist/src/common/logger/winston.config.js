"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.winstonConfig = void 0;
const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const nest_winston_1 = require("nest-winston");
const isDevelopment = process.env.NODE_ENV === 'development';
const fileFormat = winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json());
const consoleFormat = winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.errors({ stack: true }), nest_winston_1.utilities.format.nestLike('CareServices', {
    prettyPrint: true,
    colors: true,
}));
const generalLogTransport = new DailyRotateFile({
    filename: 'logs/app-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: fileFormat,
});
const errorLogTransport = new DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    level: 'error',
    format: fileFormat,
});
exports.winstonConfig = {
    level: isDevelopment ? 'debug' : 'info',
    transports: [
        new winston.transports.Console({
            format: consoleFormat,
        }),
        generalLogTransport,
        errorLogTransport,
    ],
    exceptionHandlers: [
        new winston.transports.File({
            filename: 'logs/exceptions.log',
            format: fileFormat,
        }),
    ],
    rejectionHandlers: [
        new winston.transports.File({
            filename: 'logs/rejections.log',
            format: fileFormat,
        }),
    ],
};
exports.logger = winston.createLogger(exports.winstonConfig);
//# sourceMappingURL=winston.config.js.map