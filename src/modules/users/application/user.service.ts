import { Injectable } from '@nestjs/common';
import { UserRepository } from '../infrastructure/user.repository';
import type { User, CreateUserData, UpdateUserData, UserPublicProfile } from '../domain/user.types';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async create(data: CreateUserData): Promise<User> {
    // TODO: Add password hashing before saving
    // TODO: Add email normalization
    // TODO: Check for existing user with same email
    return this.userRepository.create(data);
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    // TODO: Verify user exists
    return this.userRepository.update(id, data);
  }

  toPublicProfile(user: User): UserPublicProfile {
    const { id, email, firstName, lastName, role, avatar, bio, createdAt } = user;

    return {
      id,
      email,
      firstName,
      lastName,
      role,
      avatar,
      bio,
      createdAt,
    };
  }

  // TODO: Implement additional business logic:
  // - changePassword(userId: string, oldPassword: string, newPassword: string)
  // - deactivateAccount(userId: string)
  // - verifyEmail(userId: string)
}
