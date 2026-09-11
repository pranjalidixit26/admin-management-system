import { Controller, Post, Body } from '@nestjs/common';
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
  signup(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  @Post('login')
  login(@Body() loginCustomerDto: LoginCustomerDto) {
    return this.customerAuthService.login(loginCustomerDto);
  }
}