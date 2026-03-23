export enum UserRole {
  BUYER = 'BUYER',
  SELLER = 'SELLER',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export interface User {
  id: string;
  email: string;
  password: string; // hashed
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string | null;
  phone?: string | null;
  bio?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPublicProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string | null;
  bio?: string | null;
  createdAt: Date;
}

export interface CreateUserData {
  email: string;
  password: string; // plain password, will be hashed in service
  firstName: string;
  lastName: string;
  role?: UserRole;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  phone?: string;
  bio?: string;
  status?: UserStatus;
}
