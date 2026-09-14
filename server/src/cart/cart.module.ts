import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { CustomerAuthModule } from '../customer-auth/customer-auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Cart, CartItem, Product]),
        CustomerAuthModule,
    ],
    controllers: [CartController],
    providers: [CartService],
    exports: [TypeOrmModule],
})
export class CartModule {}