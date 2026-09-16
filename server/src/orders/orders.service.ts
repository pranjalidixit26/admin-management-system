import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
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

    async createFromCart(customerId: number, addressId: number) {
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
                status: OrderStatus.PENDING,
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
            order: { created_at: 'DESC' },
        });
    }

    async findOne(customerId: number, id: number) {
        const order = await this.orderRepo.findOne({ where: { id } });
        if (!order) throw new NotFoundException('Order not found');
        if (order.customerId !== customerId) throw new ForbiddenException();
        return order;
    }
}