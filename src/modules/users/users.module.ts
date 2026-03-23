import { Module } from '@nestjs/common';
import { UserService } from './application/user.service';
import { UserRepository } from './infrastructure/user.repository';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [UserService, UserRepository],
  exports: [UserService, UserRepository],
})
export class UsersModule {}
