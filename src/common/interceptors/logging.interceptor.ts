import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import type { Request } from 'express';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);
  private readonly isDevelopment = process.env.NODE_ENV !== 'production';

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, body, headers } = request;
    const startTime = Date.now();

    // Always log basic request info
    this.logger.log(`🚀 ${method} ${url}`);

    // In development, log detailed info
    if (this.isDevelopment) {
      if (body && Object.keys(body).length > 0) {
        const sanitizedBody = this.sanitizeRequestBody(body);
        this.logger.debug(`📝 Request Body: ${JSON.stringify(sanitizedBody, null, 2)}`);
      }

      const sanitizedHeaders = this.sanitizeHeaders(headers);
      this.logger.debug(`📋 Request Headers: ${JSON.stringify(sanitizedHeaders, null, 2)}`);
    }

    return next.handle().pipe(
      tap({
        next: (response) => {
          const duration = Date.now() - startTime;
          const logLevel = this.shouldLogLevel(method, url, duration);

          this.logger[logLevel](`✅ ${method} ${url} - ${duration}ms`);

          // In development, log response details
          if (this.isDevelopment && response && typeof response === 'object') {
            const sanitizedResponse = this.sanitizeResponse(response);
            this.logger.debug(`📤 Response Body: ${JSON.stringify(sanitizedResponse, null, 2)}`);
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error(`❌ ${method} ${url} - ${duration}ms`);

          // Always log validation errors in detail (they're important for debugging)
          if (error.response?.message) {
            const logLevel = this.isDevelopment ? 'error' : 'warn';
            this.logger[logLevel](
              `🔍 Validation Details: ${JSON.stringify(error.response, null, 2)}`,
            );
          }
        },
      }),
    );
  }

  private shouldLogLevel(method: string, url: string, duration: number): 'log' | 'warn' {
    // In production, only warn about slow requests or errors
    if (!this.isDevelopment) {
      // Warn about slow requests (>1s) or error status codes
      if (duration > 1000) return 'warn';
      if (url.includes('/error')) return 'warn';
    }
    return 'log';
  }

  private sanitizeRequestBody(body: any): any {
    const sanitized = { ...body };

    // Remove sensitive fields from logging
    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };

    // Remove sensitive headers from logging
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    sensitiveHeaders.forEach((header) => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private sanitizeResponse(response: any): any {
    const sanitized = { ...response };

    // Remove sensitive fields from response logging
    const sensitiveFields = ['password', 'token', 'accessToken', 'refreshToken'];
    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}
