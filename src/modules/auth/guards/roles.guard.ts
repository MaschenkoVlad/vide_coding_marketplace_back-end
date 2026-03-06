import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/auth.decorators';
import type { UserRole } from '../../users/domain/user.types';
import type { AuthenticatedRequest } from '../constants/auth.constants';

/**
 * Roles Authorization Guard
 *
 * TODO: Implement RBAC validation:
 * - Check if user has required roles
 * - Supports multiple roles (OR logic)
 * - Must be used after JwtAuthGuard
 *
 * @throws ForbiddenException if user lacks required roles
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // TODO: Implement role checking logic:
    // 1. Extract user from request (set by JwtAuthGuard)
    // 2. Check if user.role is in requiredRoles
    // 3. Return true if authorized, throw ForbiddenException otherwise

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // TODO: Check user role against requiredRoles
    throw new ForbiddenException('Role-based access control not yet implemented');
  }
}
