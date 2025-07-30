import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';

const isDevelopment = process.env.NODE_ENV === 'development';

// Custom format for file logs
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// Custom format for console logs
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  nestWinstonModuleUtilities.format.nestLike('CareServices', {
    prettyPrint: true,
    colors: true,
  }),
);

// Daily rotate file transport for all logs
const generalLogTransport = new DailyRotateFile({
  filename: 'logs/app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  format: fileFormat,
});

// Daily rotate file transport for errors only
const errorLogTransport = new DailyRotateFile({
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  level: 'error',
  format: fileFormat,
});

// Create Winston logger configuration
export const winstonConfig: winston.LoggerOptions = {
  level: isDevelopment ? 'debug' : 'info',
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat,
    }),
    // File transports
    generalLogTransport,
    errorLogTransport,
  ],
  // Handle exceptions and rejections
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

// Create logger instance
export const logger = winston.createLogger(winstonConfig);
