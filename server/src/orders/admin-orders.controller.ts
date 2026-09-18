import { Controller, Get, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../auth/permission.guard';
import { RequirePermission } from '../auth/require-permission.decorator';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus } from './order.entity';

@Controller('orders/admin')
export class AdminOrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    @Get()
    @UseGuards(JwtAuthGuard, PermissionGuard)
    @RequirePermission('ORDER_VIEW')
    findAll(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
        @Query('status') status?: OrderStatus,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.ordersService.findAllForAdmin(
            page ? +page : 1,
            limit ? +limit : 10,
            search,
            status,
            startDate,
            endDate,
        );
    }

    @Get('stats')
    @UseGuards(JwtAuthGuard, PermissionGuard)
    @RequirePermission('ORDER_VIEW')
    getStats() {
        return this.ordersService.getStatsForAdmin();
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, PermissionGuard)
    @RequirePermission('ORDER_VIEW')
    findOne(@Param('id') id: string) {
        return this.ordersService.findOneForAdmin(+id);
    }

    @Patch(':id/status')
    @UseGuards(JwtAuthGuard, PermissionGuard)
    @RequirePermission('ORDER_UPDATE_STATUS')
    updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
        return this.ordersService.updateStatus(+id, dto.status);
    }
}