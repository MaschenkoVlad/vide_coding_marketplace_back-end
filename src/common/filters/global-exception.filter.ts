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

    const message =
      exception instanceof HttpException ? exception.getResponse() : 'Internal server error';

    // Log the error with context
    this.logger.error(
      {
        statusCode: status,
        path: request.url,
        method: request.method,
        message: exception instanceof Error ? exception.message : 'Unknown error',
        stack: exception instanceof Error ? exception.stack : undefined,
      },
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
          : message,
    };

    response.status(status).json(responseBody);
  }
}
