import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';

@Entity('order_items')
export class OrderItem {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    orderId: number;

    @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'orderId' })
    order: Order;

    @Column()
    variantId: number;

    @ManyToOne(() => ProductVariant, { eager: true })
    @JoinColumn({ name: 'variantId' })
    variant: ProductVariant;

    // Snapshots — captured at order time
    @Column()
    productName: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    attributesSnapshot: string | null; // JSON.stringify of variant.attributes at order time

    @Column('decimal', { precision: 10, scale: 2 })
    price: number;

    @Column()
    quantity: number;
}