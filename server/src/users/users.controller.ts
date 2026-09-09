import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    ParseIntPipe,
    UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { PermissionGuard } from '../auth/permission.guard';
import { RequirePermission } from '../auth/require-permission.decorator';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post()
    create(@Body() createUserDto: CreateUserDto){
        return this.usersService.create(createUserDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll() {
        return this.usersService.findAll();
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.usersService.findOne(id);
    }

    @UseGuards(JwtAuthGuard, PermissionGuard)
    @RequirePermission('USER_EDIT')
    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateUserDto: UpdateUserDto,
    ) {
        return this.usersService.update(id, updateUserDto);
    }

    @UseGuards(JwtAuthGuard, PermissionGuard)
    @RequirePermission('USER_EDIT')
    @Patch(':id/roles')
    assignRoles(
        @Param('id', ParseIntPipe) id: number,
        @Body() assignRolesDto: AssignRolesDto,
    ) {
        return this.usersService.assignRoles(id, assignRolesDto.roleIds);
    }

    @UseGuards(JwtAuthGuard, PermissionGuard)
    @RequirePermission('USER_DELETE')
    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number){
        return this.usersService.remove(id);
    }
}