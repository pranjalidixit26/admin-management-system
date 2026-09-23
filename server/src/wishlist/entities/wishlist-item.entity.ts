import {
    Entity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Unique,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { Product } from '../../products/entities/product.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';

@Entity('wishlist_items')
@Unique(['customer', 'product'])
export class WishlistItem {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'customer_id' })
    customer: Customer;

    @ManyToOne(() => Product, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @ManyToOne(() => ProductVariant, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'variant_id' })
    variant: ProductVariant | null;

    @CreateDateColumn()
    created_at: Date;
}