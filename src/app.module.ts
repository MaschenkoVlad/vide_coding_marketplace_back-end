import { Module } from '@nestjs/common';
import { AppConfigModule } from './modules/config/config.module';
import { DatabaseModule } from './modules/database/database.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ListingsModule } from './modules/listings/listings.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    HealthModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    ListingsModule,
  ],
})
export class AppModule {}
