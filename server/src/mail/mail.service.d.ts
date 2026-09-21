import { Order } from '../orders/order.entity';
export declare class MailService {
    private readonly logger;
    private readonly resend;
    private readonly from;
    private readonly testTo?;
    constructor();
    private buildEmail;
    sendOrderStatusEmails(orders: Order[]): Promise<void>;
}
