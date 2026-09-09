import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    ParseIntPipe,
    UseGuards
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../auth/permission.guard';
import { RequirePermission } from '../auth/require-permission.decorator';

@UseGuards(JwtAuthGuard)
@Controller('roles')
export class RolesController {
    constructor(private readonly rolesService: RolesService) {}

    @UseGuards(PermissionGuard)
    @RequirePermission('ROLE_CREATE')
    @Post()
    create(@Body() createRoleDto: CreateRoleDto) {
        return this.rolesService.create(createRoleDto);
    }

    @Get()
    findAll() {
        return this.rolesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.rolesService.findOne(id);
    }

    @UseGuards(PermissionGuard)
    @RequirePermission('ROLE_EDIT')
    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateRoleDto: UpdateRoleDto,
    ) {
        return this.rolesService.update(id, updateRoleDto);
    }

    @UseGuards(PermissionGuard)
    @RequirePermission('ROLE_EDIT')
    @Patch(':id/permissions')
    assignPermissions(
        @Param('id', ParseIntPipe) id: number,
        @Body() assignPermissionsDto: AssignPermissionsDto,
    ) {
        return this.rolesService.assignPermissions(id, assignPermissionsDto.permissionIds);
    }

    @UseGuards(PermissionGuard)
    @RequirePermission('ROLE_DELETE')
    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.rolesService.remove(id);
    }
}