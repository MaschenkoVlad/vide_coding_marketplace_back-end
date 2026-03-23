import type { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    // Handle validation errors properly
    let clientMessage: string;
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') {
        clientMessage = response;
      } else if (typeof response === 'object' && response !== null) {
        // Handle validation errors from ValidationPipe
        if ('message' in response && Array.isArray(response.message)) {
          clientMessage = response.message.join(', ');
        } else if ('message' in response && typeof response.message === 'string') {
          clientMessage = response.message;
        } else {
          clientMessage = 'Validation failed';
        }
      } else {
        clientMessage = 'Bad Request';
      }
    } else {
      clientMessage = 'Internal server error';
    }

    // Log the error with context
    let logMessage: string;
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') {
        logMessage = response;
      } else if (typeof response === 'object' && response !== null) {
        // Handle validation errors from ValidationPipe
        if ('message' in response && Array.isArray(response.message)) {
          logMessage = `Validation failed: ${response.message.join(', ')}`;
        } else if ('message' in response && typeof response.message === 'string') {
          logMessage = response.message;
        } else {
          logMessage = `HTTP Exception: ${status}`;
        }
      } else {
        logMessage = `HTTP Exception: ${status}`;
      }
    } else {
      logMessage = exception instanceof Error ? exception.message : 'Unknown error';
    }

    this.logger.error(
      `HTTP Exception: ${status} ${request.method} ${request.url} - ${logMessage}`,
      exception instanceof Error ? exception.stack : undefined,
      'Exception caught',
    );

    // Send safe response to client (don't leak internal details in production)
    const isProduction = process.env.NODE_ENV === 'production';
    const responseBody = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message:
        isProduction && status === HttpStatus.INTERNAL_SERVER_ERROR
          ? 'Internal server error'
          : clientMessage,
    };

    response.status(status).json(responseBody);
  }
}
