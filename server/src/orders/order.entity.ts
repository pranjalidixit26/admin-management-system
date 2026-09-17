import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Customer } from '../customers/entities/customer.entity';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    SHIPPED = 'shipped',
    DELIVERED = 'delivered',
    CANCELLED = 'cancelled',
}

@Entity('orders')
export class Order {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    customerId: number;

    @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'customerId' })
    customer: Customer;

    // Address snapshot — captured at order time so later address edits/deletes don't affect old orders
    @Column()
    addressLine: string;

    @Column()
    city: string;

    @Column()
    state: string;

    @Column()
    pincode: string;

    @Column()
    country: string;

    @Column()
    phone: string;

    @OneToMany(() => OrderItem, (item) => item.order, { cascade: true, eager: true })
    items: OrderItem[];

    @Column('decimal', { precision: 10, scale: 2 })
    totalAmount: number;

    @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
    razorpayOrderId: string | null;

    @Column({ type: 'varchar', length: 100, nullable: true })
    razorpayPaymentId: string | null;

    @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
    status: OrderStatus;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}