import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Address } from '../addresses/address.entity';
import { Cart } from '../cart/entities/cart.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { AdminOrdersController } from './admin-orders.controller';
import { CustomerAuthModule } from '../customer-auth/customer-auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Order, OrderItem, Address, Cart, CartItem]),
        CustomerAuthModule,
    ],
    controllers: [AdminOrdersController, OrdersController], // 👈 order swap kiya
    providers: [OrdersService],
    exports: [OrdersService],
})
export class OrdersModule {}