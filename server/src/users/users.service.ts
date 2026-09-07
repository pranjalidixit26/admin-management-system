import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    async create(createUserDto: CreateUserDto): Promise<User>{
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const user = this.userRepository.create({
            ...createUserDto,
            password: hashedPassword,
        });
        return this.userRepository.save(user);
    }

    async findAll(): Promise<User[]> {
        return this.userRepository.find();
    }

    async findOne(id: number): Promise<User> {
        const user = await this.userRepository.findOne({where: { id }});
        if(!user){
            throw new NotFoundException(`User with id ${id} not found`);
        }
        return user;
    }

    async update(id: number, updateUserDto: UpdateUserDto): Promise<User>{
        const user = await this.findOne(id);
        if(updateUserDto.password){
            updateUserDto.password=await bcrypt.hash(updateUserDto.password, 10);
        }
        Object.assign(user, updateUserDto);
        return this.userRepository.save(user);
    }

    async remove(id: number): Promise<void> {
        const user = await this.findOne(id);
        await this.userRepository.remove(user);
    }
}   