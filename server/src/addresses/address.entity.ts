import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Customer } from '../customers/entities/customer.entity';

@Entity('addresses')
export class Address {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    customerId: number;

    @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'customerId' })
    customer: Customer;

    @Column({ nullable: true })
    label: string; // "Home", "Work", etc.

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

    @Column({ default: false })
    isDefault: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}