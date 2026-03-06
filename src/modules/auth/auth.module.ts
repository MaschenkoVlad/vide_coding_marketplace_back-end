import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './application/auth.service';
import { RefreshTokenRepository } from './infrastructure/refresh-token.repository';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService, RefreshTokenRepository],
  exports: [AuthService, RefreshTokenRepository],
})
export class AuthModule {}
