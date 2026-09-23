import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Resend } from 'resend';
import { Order } from '../orders/order.entity';

// Sirf inhi statuses pe mail jayegi (pending pe nahi)
const STATUS_COPY: Record<string, { subject: string; headline: string }> = {
    confirmed: { subject: 'Your order #{id} is confirmed', headline: 'Your order has been confirmed.' },
    shipped: { subject: 'Your order #{id} has shipped', headline: 'Good news! Your order is on its way.' },
    delivered: { subject: 'Your order #{id} was delivered', headline: 'Your order has been delivered.' },
    cancelled: { subject: 'Your order #{id} was cancelled', headline: 'Your order has been cancelled.' },
};

type MailPayload = { from: string; to: string; subject: string; html: string };

const esc = (s: unknown) =>
    String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private readonly resend: Resend | null;
    private readonly from: string;
    private readonly testTo?: string;

    constructor(@InjectQueue('mail') private readonly mailQueue: Queue) {
        const key = process.env.RESEND_API_KEY;
        this.resend = key ? new Resend(key) : null;
        this.from = process.env.MAIL_FROM ?? 'ShopNest <onboarding@resend.dev>';
        this.testTo = process.env.MAIL_TEST_TO || undefined;
        if (!this.resend) {
            this.logger.warn('RESEND_API_KEY not set - order status emails are disabled');
        }
    }

    private buildEmail(order: Order): MailPayload | null {
        const copy = STATUS_COPY[order.status];
        const customer = order.customer;
        if (!copy || !customer?.email) return null;

        const testPrefix = this.testTo ? `[TEST for ${customer.email}] ` : '';
        const itemsHtml = (order.items ?? [])
            .map(
                (i) =>
                    `<tr><td style="padding:6px 0">${esc(i.productName)} × ${i.quantity}</td>` +
                    `<td style="padding:6px 0;text-align:right">₹${(Number(i.price) * i.quantity).toFixed(2)}</td></tr>`,
            )
            .join('');

        const html = `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#222">
  <h2 style="margin-bottom:4px">ShopNest</h2>
  <p>Hi ${esc(customer.name)},</p>
  <p><strong>${copy.headline}</strong></p>
  <p style="color:#666;margin:0">Order #${order.id}</p>
  <table style="width:100%;border-collapse:collapse;margin-top:12px">${itemsHtml}
    <tr><td style="padding-top:10px;border-top:1px solid #ddd"><strong>Total</strong></td>
    <td style="padding-top:10px;border-top:1px solid #ddd;text-align:right"><strong>₹${Number(order.totalAmount).toFixed(2)}</strong></td></tr>
  </table>
  <p style="color:#666;margin-top:16px">Delivery address: ${esc(order.addressLine)}, ${esc(order.city)}, ${esc(order.state)} ${esc(order.pincode)}</p>
  <p style="color:#999;font-size:12px">Thank you for shopping with ShopNest!</p>
</div>`;

        return {
            from: this.from,
            to: this.testTo ?? customer.email,
            subject: testPrefix + copy.subject.replace('{id}', String(order.id)),
            html,
        };
    }

    // Kabhi throw nahi karta: queue me daalna fail ho to bhi status update fail nahi hona chahiye
    async sendOrderStatusEmails(orders: Order[]): Promise<void> {
        if (!this.resend) return;
        try {
            const emails = orders
                .map((o) => this.buildEmail(o))
                .filter((e): e is MailPayload => e !== null);

            if (emails.length === 0) return;

            await this.mailQueue.add(
                'send-order-status',
                { emails },
                { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
            );
        } catch (err) {
            this.logger.error('Failed to queue order status emails', (err as Error).stack);
        }
    }

    // Processor isse call karega actual Resend batch-send ke liye
    async sendBatch(emails: MailPayload[]): Promise<void> {
        for (let i = 0; i < emails.length; i += 100) {
            const { error } = await this.resend!.batch.send(emails.slice(i, i + 100));
            if (error) throw new Error(`Resend batch failed: ${error.message}`);
        }
    }
}