import { Injectable, Inject, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import Redis from 'ioredis';
import { CustomersService } from '../customers/customers.service';
import { REDIS_CLIENT } from '../redis/redis.module';

@Injectable()
export class CustomerJwtStrategy extends PassportStrategy(Strategy, 'jwt-customer') {
  private readonly logger = new Logger(CustomerJwtStrategy.name);

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
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      this.logger.warn(`Redis get failed for ${cacheKey}: ${(err as Error).message}`);
    }

    // Cache MISS — fetch from DB like before
    const customer = await this.customersService.findOne(payload.sub);
    const result = { customerId: customer.id, email: customer.email, name: customer.name };

    // Store for next time, expires in 1 hour (3600 seconds).
    // Customer update/remove pe invalidate hota hai, TTL sirf safety net hai.
    try {
      await this.redis.set(cacheKey, JSON.stringify(result), 'EX', 3600);
    } catch (err) {
      this.logger.warn(`Redis set failed for ${cacheKey}: ${(err as Error).message}`);
    }

    return result;
  }
}