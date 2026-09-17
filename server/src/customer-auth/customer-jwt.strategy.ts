import { Injectable, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import Redis from 'ioredis';
import { CustomersService } from '../customers/customers.service';
import { REDIS_CLIENT } from '../redis/redis.module';

@Injectable()
export class CustomerJwtStrategy extends PassportStrategy(Strategy, 'jwt-customer') {
  constructor(
    private readonly customersService: CustomersService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.CUSTOMER_JWT_SECRET as string,
    });
  }

  async validate(payload: any) {
    const cacheKey = `customer:${payload.sub}`;

    // Cache HIT — skip the DB lookup entirely
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Cache MISS — fetch from DB like before
    const customer = await this.customersService.findOne(payload.sub);
    const result = { customerId: customer.id, email: customer.email, name: customer.name };

    // Store for next time, expires in 10 minutes (600 seconds)
    await this.redis.set(cacheKey, JSON.stringify(result), 'EX', 600);

    return result;
  }
}