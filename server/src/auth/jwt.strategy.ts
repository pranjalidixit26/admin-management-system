import { Inject, Injectable } from "@nestjs/common";
import { PassportStrategy} from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { InjectRepository } from "@nestjs/typeorm";
import {Repository} from "typeorm";
import { User } from "../users/entities/user.entity";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){
    constructor(
        @InjectRepository(User)
        private readonly userRepository:Repository<User>,
    ){
        super({
            jwtFromRequest:ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration:false,
            secretOrKey:process.env.JWT_SECRET as string,
        });
    }

    async validate(payload:any){
        const user=await this.userRepository.findOne({
            where:{id:payload.sub},
            relations:{roles:{permissions:true}},
        });

        const permissionCodes=Array.from(
            new Set(
                (user?.roles??[]).flatMap(role=>(role.permissions??[]).map(p=>p.code))
            )
        );

        return {userId:payload.sub, email:payload.email, permissions:permissionCodes};
    }
}