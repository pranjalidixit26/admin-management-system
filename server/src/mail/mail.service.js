"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const resend_1 = require("resend");
const STATUS_COPY = {
    confirmed: { subject: 'Your order #{id} is confirmed', headline: 'Your order has been confirmed.' },
    shipped: { subject: 'Your order #{id} has shipped', headline: 'Good news! Your order is on its way.' },
    delivered: { subject: 'Your order #{id} was delivered', headline: 'Your order has been delivered.' },
    cancelled: { subject: 'Your order #{id} was cancelled', headline: 'Your order has been cancelled.' },
};
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
let MailService = MailService_1 = class MailService {
    logger = new common_1.Logger(MailService_1.name);
    resend;
    from;
    testTo;
    constructor() {
        const key = process.env.RESEND_API_KEY;
        this.resend = key ? new resend_1.Resend(key) : null;
        this.from = process.env.MAIL_FROM ?? 'ShopNest <onboarding@resend.dev>';
        this.testTo = process.env.MAIL_TEST_TO || undefined;
        if (!this.resend) {
            this.logger.warn('RESEND_API_KEY not set - order status emails are disabled');
        }
    }
    buildEmail(order) {
        const copy = STATUS_COPY[order.status];
        const customer = order.customer;
        if (!copy || !customer?.email)
            return null;
        const testPrefix = this.testTo ? `[TEST for ${customer.email}] ` : '';
        const itemsHtml = (order.items ?? [])
            .map((i) => `<tr><td style="padding:6px 0">${esc(i.productName)} × ${i.quantity}</td>` +
            `<td style="padding:6px 0;text-align:right">₹${(Number(i.price) * i.quantity).toFixed(2)}</td></tr>`)
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
    async sendOrderStatusEmails(orders) {
        if (!this.resend)
            return;
        try {
            const emails = orders
                .map((o) => this.buildEmail(o))
                .filter((e) => e !== null);
            for (let i = 0; i < emails.length; i += 100) {
                const { error } = await this.resend.batch.send(emails.slice(i, i + 100));
                if (error)
                    this.logger.error(`Resend batch failed: ${error.message}`);
            }
        }
        catch (err) {
            this.logger.error('Failed to send order status emails', err.stack);
        }
    }
};
exports.MailService = MailService;
exports.MailService = MailService = MailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], MailService);
//# sourceMappingURL=mail.service.js.map