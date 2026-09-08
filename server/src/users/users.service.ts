import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
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
        return this.userRepository.find({
            relations: { roles: true },
        });
    }

    async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
        where: { id },
        relations: { roles: true },
    });
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

    async assignRoles(id: number, roleIds: number[]): Promise<User> {
        const user = await this.findOne(id);
        const roles = await this.roleRepository.findBy({ id: In(roleIds) });

        await this.userRepository
            .createQueryBuilder()
            .relation(User, 'roles')
            .of(id)
            .addAndRemove(roles, user.roles ?? []);

        return this.findOne(id);
    }
}