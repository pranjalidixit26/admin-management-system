import { Controller, Post, Body, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PaymentsService } from './payments.service';
import { CustomerJwtAuthGuard } from '../customer-auth/customer-jwt-auth.guard'; // adjust to your actual guard

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @UseGuards(CustomerJwtAuthGuard)
  @Post('create-order')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  createOrder(@Body() body: { amount: number; addressId: number }, @Req() req: any) {
    return this.paymentsService.createOrder(body.amount, req.user.customerId, body.addressId);
  }

  @UseGuards(CustomerJwtAuthGuard)
  @Post('verify')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  verify(@Body() body: any, @Req() req: any) {
    const customerId = req.user.customerId;
    return this.paymentsService.verifyAndPlaceOrder(
      body.razorpay_order_id,
      body.razorpay_payment_id,
      body.razorpay_signature,
      body.addressId,
      customerId,
    );
  }

  @Post('webhook')
  async webhook(@Req() req: any) {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody: Buffer = req.body; // raw Buffer, thanks to express.raw() in main.ts
    const isValid = this.paymentsService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      throw new BadRequestException('Invalid webhook signature');
    }
    const event = JSON.parse(rawBody.toString('utf8'));
    await this.paymentsService.handleWebhookEvent(event);
    return { status: 'ok' };
  }
}