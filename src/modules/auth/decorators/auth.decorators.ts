import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '../../users/domain/user.types';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify required roles for an endpoint.
 * To be used with RolesGuard.
 *
 * @example
 * @Roles(UserRole.ADMIN, UserRole.MODERATOR)
 * @Get('admin-only')
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Decorator to mark a route as public (no authentication required).
 * To be used with PublicAuthGuard.
 *
 * @example
 * @Public()
 * @Get('health')
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
