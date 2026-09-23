import { Inject, Injectable, Logger } from "@nestjs/common";
import { PassportStrategy} from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { InjectRepository } from "@nestjs/typeorm";
import {Repository} from "typeorm";
import Redis from 'ioredis';
import { User } from "../users/entities/user.entity";
import { REDIS_CLIENT } from '../redis/redis.module';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){
    private readonly logger = new Logger(JwtStrategy.name);

    constructor(
        @InjectRepository(User)
        private readonly userRepository:Repository<User>,
        @Inject(REDIS_CLIENT) private readonly redis: Redis,
    ){
        super({
            jwtFromRequest:ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration:false,
            secretOrKey:process.env.JWT_SECRET as string,
        });
    }

    async validate(payload:any){
    const cacheKey = `admin:${payload.sub}`;

    // Cache HIT — skip DB lookup entirely
    try {
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (err) {
        this.logger.warn(`Redis get failed for ${cacheKey}: ${(err as Error).message}`);
    }

    // Cache MISS — fetch from DB like before
    try {
        const user=await this.userRepository.findOne({
            where:{id:payload.sub},
            relations:{roles:{permissions:true}},
        });

        const permissionCodes=Array.from(
            new Set(
                (user?.roles??[]).flatMap(role=>(role.permissions??[]).map(p=>p.code))
            )
        );

        const result = {userId:payload.sub, email:payload.email, permissions:permissionCodes};

        // Store for next time — 1 hour TTL since permissions can change and we don't invalidate on role/permission edits yet
        try {
            await this.redis.set(cacheKey, JSON.stringify(result), 'EX', 3600);
        } catch (err) {
            this.logger.warn(`Redis set failed for ${cacheKey}: ${(err as Error).message}`);
        }

        return result;
    } catch (err) {
        this.logger.error('VALIDATE ERROR:', err);
        throw err;
    }
}
}