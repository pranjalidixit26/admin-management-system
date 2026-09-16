import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CustomerJwtAuthGuard } from '../customer-auth/customer-jwt-auth.guard'; // adjust to your actual guard

@Controller('payments')
@UseGuards(CustomerJwtAuthGuard)
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('create-order')
  createOrder(@Body('amount') amount: number) {
    return this.paymentsService.createOrder(amount);
  }

  @Post('verify')
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
}