import { Module } from '@nestjs/common';
import { UserService } from './application/user.service';
import { UserRepository } from './infrastructure/user.repository';

@Module({
  providers: [UserService, UserRepository],
  exports: [UserService, UserRepository],
})
export class UsersModule {}
