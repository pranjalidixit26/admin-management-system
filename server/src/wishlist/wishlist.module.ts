import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';
import { WishlistItem } from './entities/wishlist-item.entity';
import { Product } from '../products/entities/product.entity';
import { CustomerAuthModule } from '../customer-auth/customer-auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([WishlistItem, Product]),
        CustomerAuthModule,
    ],
    controllers: [WishlistController],
    providers: [WishlistService],
    exports: [TypeOrmModule],
})
export class WishlistModule {}