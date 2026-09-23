import { Controller, Post, Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CustomerAuthService } from './customer-auth.service';
import { CustomersService } from '../customers/customers.service';
import { CreateCustomerDto } from '../customers/dto/create-customer.dto';
import { LoginCustomerDto } from '../customers/dto/login-customer.dto';

@Controller('customer-auth')
export class CustomerAuthController {
  constructor(
    private readonly customerAuthService: CustomerAuthService,
    private readonly customersService: CustomersService,
  ) {}

  @Post('signup')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  signup(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  login(@Body() loginCustomerDto: LoginCustomerDto) {
    return this.customerAuthService.login(loginCustomerDto);
  }
}