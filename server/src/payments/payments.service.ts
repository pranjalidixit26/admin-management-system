import { Injectable, BadRequestException } from '@nestjs/common';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';
import { OrdersService } from '../orders/orders.service';
import { OrderStatus } from '../orders/order.entity';

@Injectable()
export class PaymentsService {
  private razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID as string,
    key_secret: process.env.RAZORPAY_KEY_SECRET as string,
  });

  constructor(private ordersService: OrdersService) {}

  async createOrder(amount: number, customerId: number, addressId: number) {
    const order = await this.razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      notes: {
        customerId: String(customerId),
        addressId: String(addressId),
      },
    });
    return order; // has order.id
  }

  async verifyAndPlaceOrder(
    razorpay_order_id: string,
    razorpay_payment_id: string,
    razorpay_signature: string,
    addressId: number,
    customerId: number,
  ) {
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET as string)
    .update(body)
    .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      throw new BadRequestException('Payment verification failed');
    }

    return this.ordersService.createFromCart(
      customerId,
      addressId,
      OrderStatus.CONFIRMED,
      razorpay_order_id,
      razorpay_payment_id,
    );
  }

  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET as string)
      .update(rawBody)
      .digest('hex');
    return expected === signature;
  }

  async handleWebhookEvent(event: any) {
    if (event.event !== 'payment.captured') return; // ignore other events

    const payment = event.payload.payment.entity;
    const notes = payment.notes || {};
    const customerId = Number(notes.customerId);
    const addressId = Number(notes.addressId);

    if (!customerId || !addressId) return; // can't process without these

    return this.ordersService.createFromCart(
      customerId,
      addressId,
      OrderStatus.CONFIRMED,
      payment.order_id,
      payment.id,
    );
  }
}
//5267 3181 8797 5449