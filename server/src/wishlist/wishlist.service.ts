import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WishlistItem } from './entities/wishlist-item.entity';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';

@Injectable()
export class WishlistService {
    constructor(
        @InjectRepository(WishlistItem)
        private readonly wishlistRepo: Repository<WishlistItem>,
        @InjectRepository(Product)
        private readonly productRepo: Repository<Product>,
        @InjectRepository(ProductVariant)
        private readonly variantRepo: Repository<ProductVariant>,
    ) {}

    async addItem(customerId: number, productId: number, variantId?: number) {
        const product = await this.productRepo.findOne({ where: { id: productId } });
        if (!product) {
            throw new NotFoundException('Product not found');
        }

        let variant: ProductVariant | null = null;
        if (variantId) {
            variant = await this.variantRepo.findOne({
                where: { id: variantId },
                relations: { product: true },
            });
            if (!variant || variant.product.id !== productId) {
                throw new BadRequestException('Variant does not belong to this product');
            }
        }

        const existing = await this.wishlistRepo.findOne({
            where: { customer: { id: customerId }, product: { id: productId } },
        });
        if (existing) {
            throw new ConflictException('Product already in wishlist');
        }

        const item = this.wishlistRepo.create({
            customer: { id: customerId } as any,
            product: { id: productId } as any,
            variant: variant ? ({ id: variant.id } as any) : null,
        });
        return this.wishlistRepo.save(item);
    }

    async removeItem(customerId: number, productId: number) {
        const result = await this.wishlistRepo.delete({
            customer: { id: customerId } as any,
            product: { id: productId } as any,
        });
        if (result.affected === 0) {
            throw new NotFoundException('Item not found in wishlist');
        }
        return { message: 'Removed from wishlist' };
    }

    async getWishlist(customerId: number) {
        return this.wishlistRepo.find({
            where: { customer: { id: customerId } },
            relations: {
                product: {
                    variants: true,
                },
                variant: {
                    images: true,
                },
            },
            order: { created_at: 'DESC' },
        });
    }

    async isWishlisted(customerId: number, productId: number) {
        const existing = await this.wishlistRepo.findOne({
            where: { customer: { id: customerId }, product: { id: productId } },
        });
        return { wishlisted: !!existing };
    }
}