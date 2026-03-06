import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/auth.decorators';

/**
 * JWT Authentication Guard
 *
 * TODO: Implement JWT validation:
 * - Extract JWT from Authorization header or cookie
 * - Verify JWT signature and expiration
 * - Attach user payload to request
 * - Support public routes via @Public() decorator
 *
 * @throws UnauthorizedException if token is missing or invalid
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // TODO: Implement JWT validation logic
    // 1. Extract token from request
    // 2. Verify token
    // 3. Attach user to request
    // 4. Return true if valid, throw UnauthorizedException otherwise

    throw new UnauthorizedException('JWT authentication not yet implemented');
  }
}
