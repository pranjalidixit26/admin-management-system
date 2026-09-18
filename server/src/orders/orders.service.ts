import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import PDFDocument from 'pdfkit';
import { Order, OrderStatus } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Address } from '../addresses/address.entity';
import { Cart } from '../cart/entities/cart.entity';
import { CartItem } from '../cart/entities/cart-item.entity';

@Injectable()
export class OrdersService {
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
    ) {}

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

        return this.dataSource.transaction(async (manager) => {
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

            // Deduct stock
            for (const item of cart.items) {
                await manager.decrement(
                    'product_variants',
                    { id: item.variant.id },
                    'stock',
                    item.quantity,
                );
            }

            // Clear cart
            await manager.delete(CartItem, { cart: { id: cart.id } });

            return manager.findOne(Order, {
                where: { id: order.id },
                relations: { items: true },
            });
        });
    }

    async findAllForCustomer(customerId: number) {
        return this.orderRepo.find({
            where: { customerId },
            relations: { items: { variant: { images: true, product: true } } },
            order: { created_at: 'DESC' },
        });
    }

    async cancel(customerId: number, id: number) {
        const order = await this.orderRepo.findOne({ where: { id } });
        if (!order) throw new NotFoundException('Order not found');
        if (order.customerId !== customerId) throw new ForbiddenException();
        if (order.status === OrderStatus.CANCELLED) {
            throw new BadRequestException('Order is already cancelled');
        }
        if (order.status === OrderStatus.DELIVERED) {
            throw new BadRequestException('Delivered orders cannot be cancelled');
        }
        order.status = OrderStatus.CANCELLED;
        return this.orderRepo.save(order);
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
        async findAllForAdmin(
        page = 1,
        limit = 10,
        search?: string,
        status?: OrderStatus,
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

    async updateStatus(id: number, status: OrderStatus) {
        const order = await this.orderRepo.findOne({ where: { id } });
        if (!order) throw new NotFoundException('Order not found');
        order.status = status;
        return this.orderRepo.save(order);
    }
}