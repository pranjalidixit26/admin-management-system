import { Injectable , NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";

@Injectable()
export class RolesService {
    constructor(
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
        @InjectRepository(Permission)
        private readonly permissionRepository: Repository<Permission>,
    ) {}

    async create(createRoleDto: CreateRoleDto): Promise<Role> {
        const role =  this.roleRepository.create(createRoleDto);
        return this.roleRepository.save(role);
    }

    async findAll(): Promise<Role[]> {
        return this.roleRepository.find({
            relations: { permissions: true },
        });
    }

    async findOne(id: number): Promise<Role> {
        const role = await this.roleRepository.findOne({
            where: { id },
            relations: { permissions: true },
        });
        if(!role) {
            throw new NotFoundException(`Role with id ${id} not found`);
        }
        return role;
    }

    async update(id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
        const role = await this.findOne(id);
        Object.assign(role, updateRoleDto);
        return this.roleRepository.save(role);
    }

    async remove(id: number): Promise<void> {
        const role = await this.findOne(id);
        await this.roleRepository.remove(role);
    }

    async assignPermissions(id: number, permissionIds: number[]): Promise<Role> {
        const role = await this.findOne(id);
        const permissions = await this.permissionRepository.findBy({ id: In(permissionIds) });

        await this.roleRepository
            .createQueryBuilder()
            .relation(Role, 'permissions')
            .of(id)
            .addAndRemove(permissions, role.permissions ?? []);

        return this.findOne(id);
    }
}