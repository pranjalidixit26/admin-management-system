import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Injectable()
export class CartService {
    constructor(
        @InjectRepository(Cart)
        private readonly cartRepo: Repository<Cart>,
        @InjectRepository(CartItem)
        private readonly cartItemRepo: Repository<CartItem>,
        @InjectRepository(ProductVariant)
        private readonly variantRepo: Repository<ProductVariant>,
    ) {}

    // Fetches the customer's cart, creating an empty one if none exists yet.
    private async getOrCreateCart(customerId: number): Promise<Cart> {
        let cart = await this.cartRepo.findOne({ where: { customerId } });
        if (!cart) {
            cart = this.cartRepo.create({ customerId, items: [] });
            cart = await this.cartRepo.save(cart);
        }
        return cart;
    }

    async getCart(customerId: number): Promise<Cart> {
        return this.getOrCreateCart(customerId);
    }

    async addItem(customerId: number, dto: AddItemDto): Promise<Cart> {
        const variant = await this.variantRepo.findOne({ where: { id: dto.variantId } });
        if (!variant) {
            throw new NotFoundException('Product variant not found');
        }

        const cart = await this.getOrCreateCart(customerId);
        const quantity = dto.quantity ?? 1;

        const existing = cart.items.find((item) => item.variant.id === dto.variantId);
        if (existing) {
            const newQty = existing.quantity + quantity;
            if (newQty > variant.stock) {
                throw new BadRequestException('Requested quantity exceeds available stock');
            }
            existing.quantity = newQty;
            await this.cartItemRepo.save(existing);
        } else {
            if (quantity > variant.stock) {
                throw new BadRequestException('Requested quantity exceeds available stock');
            }
            const newItem = this.cartItemRepo.create({ cart, variant, quantity });
            await this.cartItemRepo.save(newItem);
        }

        return this.getOrCreateCart(customerId);
    }

    async updateItem(customerId: number, itemId: number, dto: UpdateItemDto): Promise<Cart> {
        const cart = await this.getOrCreateCart(customerId);
        const item = cart.items.find((i) => i.id === itemId);
        if (!item) {
            throw new NotFoundException('Cart item not found');
        }
        if (dto.quantity > item.variant.stock) {
            throw new BadRequestException('Requested quantity exceeds available stock');
        }
        item.quantity = dto.quantity;
        await this.cartItemRepo.save(item);
        return this.getOrCreateCart(customerId);
    }

    async removeItem(customerId: number, itemId: number): Promise<Cart> {
        const cart = await this.getOrCreateCart(customerId);
        const item = cart.items.find((i) => i.id === itemId);
        if (!item) {
            throw new NotFoundException('Cart item not found');
        }
        await this.cartItemRepo.remove(item);
        return this.getOrCreateCart(customerId);
    }

    async clearCart(customerId: number): Promise<void> {
        const cart = await this.getOrCreateCart(customerId);
        if (cart.items.length) {
            await this.cartItemRepo.remove(cart.items);
        }
    }
}