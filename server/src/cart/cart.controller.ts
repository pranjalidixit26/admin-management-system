import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    Req,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { CustomerJwtAuthGuard } from '../customer-auth/customer-jwt-auth.guard';

@Controller('cart')
@UseGuards(CustomerJwtAuthGuard)
export class CartController {
    constructor(private readonly cartService: CartService) {}

    @Get()
    getCart(@Req() req: any) {
        return this.cartService.getCart(req.user.customerId);
    }

    @Post('items')
    addItem(@Req() req: any, @Body() dto: AddItemDto) {
        return this.cartService.addItem(req.user.customerId, dto);
    }

    @Patch('items/:id')
    updateItem(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateItemDto) {
        return this.cartService.updateItem(req.user.customerId, +id, dto);
    }

    @Delete('items/:id')
    removeItem(@Req() req: any, @Param('id') id: string) {
        return this.cartService.removeItem(req.user.customerId, +id);
    }

    @Delete()
    clearCart(@Req() req: any) {
        return this.cartService.clearCart(req.user.customerId);
    }
}