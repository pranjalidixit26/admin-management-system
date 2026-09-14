import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { CustomersModule } from '../customers/customers.module';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerAuthController } from './customer-auth.controller';
import { CustomerJwtStrategy } from './customer-jwt.strategy';
import { CustomerJwtAuthGuard } from './customer-jwt-auth.guard';

@Module({
  imports: [
    CustomersModule,
    PassportModule.register({ defaultStrategy: 'jwt-customer' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('CUSTOMER_JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [CustomerAuthController],
  providers: [CustomerAuthService, CustomerJwtStrategy, CustomerJwtAuthGuard], // <-- add guard here
  exports: [CustomerJwtStrategy, PassportModule, CustomerJwtAuthGuard], // <-- and here
})
export class CustomerAuthModule {}