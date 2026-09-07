import { Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import {LoginDto} from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly  userRepository: Repository<User>,
        private readonly jwtService: JwtService,
    ) {}

    async login(loginDto: LoginDto) {
        const user = await this.userRepository.findOne({
            where: {email: loginDto.email},
        });

        if(!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const passwordMatches=await bcrypt.compare(loginDto.password, user.password);

        if(!passwordMatches){
            throw new UnauthorizedException('Invalid email or password');
        }

        const payload = {sub:user.id, email:user.email};
        const token=this.jwtService.sign(payload);

        return{
            access_token:token,
            user:{
                id:user.id,
                name:user.name,
                email:user.email,
            },
        };
    }
}