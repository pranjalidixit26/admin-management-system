import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class CustomerJwtStrategy extends PassportStrategy(Strategy, 'jwt-customer') {
  constructor(private readonly customersService: CustomersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.CUSTOMER_JWT_SECRET as string,
    });
  }

  async validate(payload: any) {
    const customer = await this.customersService.findOne(payload.sub);
    return { customerId: customer.id, email: customer.email, name: customer.name };
  }
}