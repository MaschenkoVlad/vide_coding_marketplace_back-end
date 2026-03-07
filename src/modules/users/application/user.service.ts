import { Injectable, ConflictException } from '@nestjs/common';
import { UserRepository } from '../infrastructure/user.repository';
import type { User, CreateUserData, UpdateUserData, UserPublicProfile } from '../domain/user.types';
import { hashPassword } from '../../../common/utils/password-hash';

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
    const existingUser = await this.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await hashPassword(data.password);

    return this.userRepository.create({
      ...data,
      password: hashedPassword,
    });
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
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
}
