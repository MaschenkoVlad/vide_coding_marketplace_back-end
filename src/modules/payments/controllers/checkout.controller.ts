import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CheckoutService } from '../application/checkout.service';
import { CreateCheckoutSessionDto } from '../dto/checkout.dto';
import type { CheckoutSessionResponseDto } from '../dto/checkout.dto';
import { AuthenticatedRequest } from '../../auth/constants/auth.constants';

@UseGuards(JwtAuthGuard)
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('session')
  @HttpCode(HttpStatus.CREATED)
  async createCheckoutSession(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateCheckoutSessionDto,
  ): Promise<CheckoutSessionResponseDto> {
    const buyerId = req.user!.userId;
    return this.checkoutService.createCheckoutSession(buyerId, dto.listingId);
  }
}
