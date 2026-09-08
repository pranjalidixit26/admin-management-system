import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthModule } from '../auth/auth.module';
import { Role } from '../roles/entities/role.entity';


@Module({
    imports: [TypeOrmModule.forFeature([User,Role]), AuthModule],
    controllers: [UsersController],
    providers: [UsersService],
    exports: [TypeOrmModule],
})
export class UsersModule {}