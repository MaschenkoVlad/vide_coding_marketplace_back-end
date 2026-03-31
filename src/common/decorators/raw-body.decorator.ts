import { createParamDecorator } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';

/**
 * Decorator to access the raw request body.
 * Required for Stripe webhook signature verification.
 *
 * Usage:
 * @Post('webhook')
 * handleWebhook(@RawBody() rawBody: string | Buffer) { ... }
 */
export const RawBody = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | Buffer => {
    const request = ctx.switchToHttp().getRequest();
    return request.rawBody || request.body;
  },
);
