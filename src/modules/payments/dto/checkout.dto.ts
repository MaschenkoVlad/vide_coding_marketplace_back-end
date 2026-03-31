import { IsUUID } from 'class-validator';

export class CreateCheckoutSessionDto {
  @IsUUID()
  listingId!: string;
}

export class CheckoutSessionResponseDto {
  checkoutUrl!: string;
  orderId!: string;
}
