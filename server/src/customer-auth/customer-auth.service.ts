import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CustomersService } from '../customers/customers.service';
import { LoginCustomerDto } from '../customers/dto/login-customer.dto';

@Injectable()
export class CustomerAuthService {
  constructor(
    private readonly customersService: CustomersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginCustomerDto: LoginCustomerDto) {
    const customer = await this.customersService.findByEmail(loginCustomerDto.email);

    if (!customer) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(loginCustomerDto.password, customer.password);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = { sub: customer.id, email: customer.email };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
      },
    };
  }
}