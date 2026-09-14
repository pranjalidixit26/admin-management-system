import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { CartItem } from './cart-item.entity';

@Entity('carts')
export class Cart {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'customer_id', unique: true })
    customerId: number;

    @OneToMany(() => CartItem, (item) => item.cart, {
        cascade: true,
        eager: true,
    })
    items: CartItem[];

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}