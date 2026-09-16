import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CustomerJwtAuthGuard } from '../customer-auth/customer-jwt-auth.guard';

@Controller('orders')
@UseGuards(CustomerJwtAuthGuard)
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    @Post()
    create(@Req() req: any, @Body() dto: CreateOrderDto) {
        return this.ordersService.createFromCart(req.user.customerId, dto.addressId);
    }

    @Get()
    findAll(@Req() req: any) {
        return this.ordersService.findAllForCustomer(req.user.customerId);
    }

    @Get(':id')
    findOne(@Req() req: any, @Param('id') id: string) {
        return this.ordersService.findOne(req.user.customerId, +id);
    }
}