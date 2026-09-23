import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { CustomersModule } from './customers/customers.module';
import { CustomerAuthModule } from './customer-auth/customer-auth.module';
import { CartModule } from './cart/cart.module';
import { AddressesModule } from './addresses/addresses.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { RedisModule } from './redis/redis.module';
import { MailModule } from './mail/mail.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';

@Module({
  imports: [
    // this loads variables from our .env file
    // isGlobal true means we don't have to import this again in every other module
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Default rate limit: 100 requests per 60 seconds per IP, applies to every route automatically
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // this sets up the actual connection to our MySQL database
    // using forRootAsync because we need to wait for .env values to load first
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),

        // automatically picks up entity files later, so we don't have to list them manually
        autoLoadEntities: true,

        // auto creates/updates tables based on our entities
        // good for development, we'll turn this off before going to production
        synchronize: false,
      }),
    }),
    UsersModule,
    RolesModule,
    PermissionsModule,
    AuthModule,
    CategoriesModule,
    ProductsModule,
    CustomersModule,
    CustomerAuthModule,
    CartModule,
    AddressesModule,
    OrdersModule,
    PaymentsModule,
    RedisModule,
    MailModule,
    DashboardModule,
    CloudinaryModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}