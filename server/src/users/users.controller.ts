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
    Query,
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
    findAll(
        @Query('page') page?:string,
        @Query('limit') limit?:string,
        @Query('search') search?:string,
    ){
        return this.usersService.findAll(
            page?parseInt(page):1,
            limit?parseInt(limit):10,
            search,
        );
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