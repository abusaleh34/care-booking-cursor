import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
  correlationId: string;
  details?: any;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const correlationId = (request.headers['x-correlation-id'] as string) || uuidv4();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';
    let details: any = undefined;

    // Handle different exception types
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || message;
        error = (exceptionResponse as any).error || error;
        details = (exceptionResponse as any).details;
      }
    } else if (exception instanceof QueryFailedError) {
      // Handle database errors
      status = HttpStatus.BAD_REQUEST;
      error = 'Database Error';

      // Sanitize database errors to avoid exposing sensitive information
      if (exception.message.includes('duplicate key')) {
        message = 'A record with this value already exists';
        details = { field: this.extractFieldFromError(exception.message) };
      } else if (exception.message.includes('foreign key constraint')) {
        message = 'Referenced record does not exist';
      } else if (exception.message.includes('not-null constraint')) {
        message = 'Required field is missing';
        details = { field: this.extractFieldFromError(exception.message) };
      } else {
        message = 'Database operation failed';
      }
    } else if (exception instanceof Error) {
      message = exception.message;

      // Log the full error for debugging
      this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack, {
        correlationId,
        path: request.url,
        method: request.method,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      });
    }

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      correlationId,
      details,
    };

    // Log error for monitoring
    this.logger.error(`HTTP ${status} Error: ${message}`, {
      correlationId,
      path: request.url,
      method: request.method,
      statusCode: status,
      error,
      details,
    });

    // Send error response
    response.status(status).json(errorResponse);
  }

  private extractFieldFromError(errorMessage: string): string {
    // Extract field name from database error messages
    const match = errorMessage.match(/column "([^"]+)"/);
    return match ? match[1] : 'unknown';
  }
}
