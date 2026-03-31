import {
  Controller,
  Post,
  Headers,
  BadRequestException,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RawBody } from '../../../common/decorators/raw-body.decorator';
import { WebhookService } from '../application/webhook.service';

@Controller('webhooks/stripe')
export class StripeWebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(
    @RawBody() rawBody: string | Buffer,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: boolean }> {
    if (!signature) {
      throw new UnauthorizedException('Missing Stripe signature');
    }

    if (!rawBody) {
      throw new BadRequestException('Missing request body');
    }

    // Verify signature
    const event = this.webhookService.verifyWebhookSignature(rawBody, signature);
    if (!event) {
      throw new UnauthorizedException('Invalid Stripe signature');
    }

    // Process the event
    const success = await this.webhookService.handleWebhookEvent(event);
    if (!success) {
      throw new BadRequestException('Failed to process webhook event');
    }

    return { received: true };
  }
}
