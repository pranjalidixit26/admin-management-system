import { Injectable, Inject, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import PDFDocument from 'pdfkit';
import { Order, OrderStatus } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Address } from '../addresses/address.entity';
import { Cart } from '../cart/entities/cart.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { MailService } from '../mail/mail.service';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';

const PRODUCTS_VERSION_KEY = 'products:version';
const ADMIN_STATS_KEY = 'admin:orders:stats';
const ADMIN_STATS_TTL = 300; 

@Injectable()
export class OrdersService {
    private readonly logger = new Logger(OrdersService.name);

    constructor(
        @InjectRepository(Order)
        private orderRepo: Repository<Order>,
        @InjectRepository(Address)
        private addressRepo: Repository<Address>,
        @InjectRepository(Cart)
        private cartRepo: Repository<Cart>,
        @InjectRepository(CartItem)
        private cartItemRepo: Repository<CartItem>,
        private dataSource: DataSource,
        private mailService: MailService,
        @Inject(REDIS_CLIENT)
        private readonly redis: Redis,
    ) {}

    // Stock badalta hai to public product list cache purana ho jata hai, isliye version badhao
    private async bumpProductsCache() {
        try {
            await this.redis.incr(PRODUCTS_VERSION_KEY);
        } catch (err) {
            this.logger.warn(`Could not bump ${PRODUCTS_VERSION_KEY}: ${(err as Error).message}`);
        }
    }

        // Order banne ya status badalne par dashboard ke numbers purane ho jate hain
    private async clearAdminStatsCache() {
        try {
            await this.redis.del(ADMIN_STATS_KEY);
        } catch (err) {
            this.logger.warn(`Could not clear ${ADMIN_STATS_KEY}: ${(err as Error).message}`);
        }
    }

        async createFromCart(
        customerId: number,
        addressId: number,
        status: OrderStatus = OrderStatus.PENDING,
        razorpayOrderId?: string,
        razorpayPaymentId?: string,
    ) {
        // Idempotency: if this razorpay order already created an order, return it as-is
        if (razorpayOrderId) {
            const existing = await this.orderRepo.findOne({
                where: { razorpayOrderId },
                relations: { items: true },
            });
            if (existing) return existing;
        }

        const address = await this.addressRepo.findOne({ where: { id: addressId } });
        if (!address) throw new NotFoundException('Address not found');
        if (address.customerId !== customerId) throw new ForbiddenException();

        const cart = await this.cartRepo.findOne({
            where: { customerId },
            relations: { items: { variant: { product: true } } },
        });

        if (!cart || !cart.items || cart.items.length === 0) {
            throw new BadRequestException('Cart is empty');
        }

        // Validate stock for every item before creating anything
        for (const item of cart.items) {
            if (item.quantity > item.variant.stock) {
                throw new BadRequestException(
                    `Insufficient stock for ${item.variant.product.name}`,
                );
            }
        }

        const created = await this.dataSource.transaction(async (manager) => {
            const totalAmount = cart.items.reduce((sum, item) => {
                const price = item.variant.price ?? item.variant.product.price;
                return sum + Number(price) * item.quantity;
            }, 0);

                        const order = manager.create(Order, {
                customerId,
                addressLine: address.addressLine,
                city: address.city,
                state: address.state,
                pincode: address.pincode,
                country: address.country,
                phone: address.phone,
                totalAmount,
                status,
                razorpayOrderId: razorpayOrderId ?? null,
                razorpayPaymentId: razorpayPaymentId ?? null,
            });
            await manager.save(order);

            const orderItemsData: Partial<OrderItem>[] = cart.items.map((item) => ({
                orderId: order.id,
                variantId: item.variant.id,
                productName: String(item.variant.product.name),
                attributesSnapshot: item.variant.attributes
                    ? JSON.stringify(item.variant.attributes)
                    : null,
                price: Number(item.variant.price ?? item.variant.product.price),
                quantity: item.quantity,
            }));
            const orderItems = orderItemsData.map((data) => manager.create(OrderItem, data));
            await manager.save(orderItems);

            // Deduct stock — atomic, race-safe (only decrements if enough stock remains)
            for (const item of cart.items) {
                const result = await manager
                    .createQueryBuilder()
                    .update('product_variants')
                    .set({ stock: () => 'stock - :qty' })
                    .where('id = :id AND stock >= :qty', {
                        id: item.variant.id,
                        qty: item.quantity,
                    })
                    .setParameter('qty', item.quantity)
                    .execute();

                if (result.affected === 0) {
                    throw new BadRequestException(
                        `Insufficient stock for ${item.variant.product.name}`,
                    );
                }
            }

            // Clear cart
            await manager.delete(CartItem, { cart: { id: cart.id } });

            return manager.findOne(Order, {
                where: { id: order.id },
                relations: { items: true },
            });
        });

        // Transaction commit ho chuka hai, ab stock badal chuka hai, cache invalidate karo
        await this.bumpProductsCache();
        await this.clearAdminStatsCache();
        return created;
    }

    async findAllForCustomer(customerId: number) {
        return this.orderRepo.find({
            where: { customerId },
            relations: { items: { variant: { images: true, product: true } } },
            order: { created_at: 'DESC' },
        });
    }

    async cancel(customerId: number, id: number) {
        const order = await this.orderRepo.findOne({
            where: { id },
            relations: { items: true },
        });
        if (!order) throw new NotFoundException('Order not found');
        if (order.customerId !== customerId) throw new ForbiddenException();
        if (order.status === OrderStatus.CANCELLED) {
            throw new BadRequestException('Order is already cancelled');
        }
        if (order.status === OrderStatus.DELIVERED) {
            throw new BadRequestException('Delivered orders cannot be cancelled');
        }

        const saved = await this.dataSource.transaction(async (manager) => {
            order.status = OrderStatus.CANCELLED;
            const updatedOrder = await manager.save(order);

            // Restore stock for every item in the cancelled order
            for (const item of order.items) {
                await manager.increment(
                    'product_variants',
                    { id: item.variantId },
                    'stock',
                    item.quantity,
                );
            }

            return updatedOrder;
        });

        await this.bumpProductsCache();
        await this.clearAdminStatsCache();
        return saved;
    }

    async findOne(customerId: number, id: number) {
        const order = await this.orderRepo.findOne({
            where: { id },
            relations: { items: { variant: { images: true, product: true } } },
        });
        if (!order) throw new NotFoundException('Order not found');
        if (order.customerId !== customerId) throw new ForbiddenException();
        return order;
    }

        async generateInvoicePdf(customerId: number, id: number): Promise<Buffer> {
        const order = await this.orderRepo.findOne({
            where: { id },
            relations: { items: true },
        });
        if (!order) throw new NotFoundException('Order not found');
        if (order.customerId !== customerId) throw new ForbiddenException();

        return this.buildInvoicePdfBuffer(order);
    }

    private buildInvoicePdfBuffer(order: Order): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc.fontSize(20).text('ShopNest', { align: 'left' });
        doc.fontSize(10).fillColor('#666').text('Tax Invoice', { align: 'left' });
        doc.moveDown(1.5);

        // Order info
        doc.fillColor('#000').fontSize(12).text(`Invoice for Order #${order.id}`);
        doc.fontSize(10).fillColor('#666').text(
            `Date: ${new Date(order.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            })}`,
        );
        doc.text(`Status: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`);
        doc.moveDown();

        // Shipping address
        doc.fillColor('#000').fontSize(11).text('Shipping Address:', { underline: true });
        doc.fontSize(10).fillColor('#333');
        doc.text(order.addressLine);
        doc.text(`${order.city}, ${order.state} ${order.pincode}`);
        doc.text(`${order.country} | Phone: ${order.phone}`);
        doc.moveDown(1.5);

        // Items table header
        doc.fillColor('#000').fontSize(11).text('Items', { underline: true });
        doc.moveDown(0.5);

        const tableTop = doc.y;
        doc.fontSize(10).fillColor('#000');
        doc.text('Item', 50, tableTop, { width: 220 });
        doc.text('Qty', 280, tableTop, { width: 60, align: 'right' });
        doc.text('Price', 350, tableTop, { width: 80, align: 'right' });
        doc.text('Subtotal', 440, tableTop, { width: 100, align: 'right' });
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(540, doc.y).strokeColor('#ccc').stroke();
        doc.moveDown(0.5);

        order.items.forEach((item) => {
            const rowY = doc.y;
            doc.fontSize(10).fillColor('#333');
            doc.text(item.productName, 50, rowY, { width: 220 });
            doc.text(String(item.quantity), 280, rowY, { width: 60, align: 'right' });
            doc.text(`Rs. ${item.price}`, 350, rowY, { width: 80, align: 'right' });
            doc.text(`Rs. ${item.price * item.quantity}`, 440, rowY, { width: 100, align: 'right' });
            doc.moveDown(0.8);
        });

        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(540, doc.y).strokeColor('#ccc').stroke();
        doc.moveDown(0.5);

        doc.fontSize(12).fillColor('#000').text(
            `Total: Rs. ${order.totalAmount}`,
            { align: 'right' },
        );

        doc.moveDown(2);
        doc.fontSize(9).fillColor('#999').text('Thank you for shopping with ShopNest!', { align: 'center' });

        doc.end();
    });
}

    async generateInvoicePdfForAdmin(id: number): Promise<Buffer> {
        const order = await this.orderRepo.findOne({
            where: { id },
            relations: { items: true },
        });
        if (!order) throw new NotFoundException('Order not found');

        return this.buildInvoicePdfBuffer(order);
    }
        async findAllForAdmin(
        page = 1,
        limit = 10,
        search?: string,
        status?: OrderStatus,
        startDate?: string,
        endDate?: string,
    ) {
        const query = this.orderRepo
            .createQueryBuilder('order')
            .leftJoinAndSelect('order.items', 'items')
            .leftJoinAndSelect('order.customer', 'customer')
            .orderBy('order.created_at', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        if (status) {
            query.andWhere('order.status = :status', { status });
        }

        if (startDate) {
            query.andWhere('order.created_at >= :startDate', { startDate: `${startDate} 00:00:00` });
        }

        if (endDate) {
            query.andWhere('order.created_at <= :endDate', { endDate: `${endDate} 23:59:59` });
        }

        if (search) {
            query.andWhere(
                '(customer.name LIKE :search OR customer.email LIKE :search OR CAST(order.id AS CHAR) LIKE :search)',
                { search: `%${search}%` },
            );
        }

        const [data, total] = await query.getManyAndCount();
        return { data, total, page, limit };
    }

        async findOneForAdmin(id: number) {
        const order = await this.orderRepo.findOne({
            where: { id },
            relations: { items: true, customer: true },
        });
        if (!order) throw new NotFoundException('Order not found');
        return order;
    }

    async exportAllForAdmin(): Promise<string> {
        const orders = await this.orderRepo.find({
            relations: { items: true, customer: true },
            order: { created_at: 'DESC' },
        });

        const header = [
            'Order ID', 'Customer Name', 'Customer Email', 'Status', 'Total',
            'Date', 'Payment Status', 'Payment ID', 'Address', 'Item Count',
        ];

        const escape = (val: unknown) => {
            const str = String(val ?? '');
            return /[,"\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
        };

        const rows = orders.map((order) => [
            order.id,
            order.customer?.name ?? '',
            order.customer?.email ?? '',
            order.status,
            order.totalAmount,
            new Date(order.created_at).toLocaleDateString('en-IN'),
            order.razorpayPaymentId ? 'Paid' : 'Payment Pending',
            order.razorpayPaymentId ?? '',
            `${order.addressLine}, ${order.city}, ${order.state} ${order.pincode}, ${order.country}`,
            order.items?.length ?? 0,
        ]);

        return [header, ...rows].map((row) => row.map(escape).join(',')).join('\n');
    }

    async updateStatus(id: number, status: OrderStatus) {
        const order = await this.orderRepo.findOne({
            where: { id },
            relations: { customer: true, items: true },
        });
        if (!order) throw new NotFoundException('Order not found');
        if (order.status === status) return order;
        order.status = status;
        const saved = await this.orderRepo.save(order);
        await this.clearAdminStatsCache();
        void this.mailService.sendOrderStatusEmails([saved]);
        return saved;
    }

    async bulkUpdateStatus(orderIds: number[], status: OrderStatus) {
        const orders = await this.orderRepo.find({
            where: { id: In(orderIds) },
            relations: { customer: true, items: true },
        });
        const changed = orders.filter((o) => o.status !== status);
        changed.forEach((o) => (o.status = status));
        const result = await this.orderRepo
            .createQueryBuilder()
            .update(Order)
            .set({ status })
            .whereInIds(orderIds)
            .execute();
        await this.clearAdminStatsCache();
        void this.mailService.sendOrderStatusEmails(changed);

        return { updated: result.affected ?? 0 };
    }


        async getStatsForAdmin() {
        try {
            const cached = await this.redis.get(ADMIN_STATS_KEY);
            if (cached) return JSON.parse(cached);
        } catch (err) {
            this.logger.warn(`Could not read ${ADMIN_STATS_KEY}: ${(err as Error).message}`);
        }

        const result = await this.orderRepo
        .createQueryBuilder('order')
        .select('COUNT(order.id)', 'totalOrders')
        .addSelect(
            'COALESCE(SUM(CASE WHEN order.status != :cancelled THEN order.totalAmount ELSE 0 END), 0)',
            'totalRevenue',
        )
        .setParameter('cancelled', OrderStatus.CANCELLED)
        .getRawOne();

        const statusRows = await this.orderRepo
            .createQueryBuilder('order')
            .select('order.status', 'status')
            .addSelect('COUNT(order.id)', 'count')
            .groupBy('order.status')
            .getRawMany();

        const stats = {
            totalOrders: Number(result.totalOrders),
            totalRevenue: Number(result.totalRevenue),
            statusBreakdown: statusRows.map((r) => ({
                status: r.status,
                count: Number(r.count),
            })),
        };

        try {
            await this.redis.set(ADMIN_STATS_KEY, JSON.stringify(stats), 'EX', ADMIN_STATS_TTL);
        } catch (err) {
            this.logger.warn(`Could not write ${ADMIN_STATS_KEY}: ${(err as Error).message}`);
        }
        return stats;
    }
}