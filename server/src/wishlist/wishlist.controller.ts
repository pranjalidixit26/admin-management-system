import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Body,
    Req,
    UseGuards,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { AddWishlistItemDto } from './dto/add-wishlist-item.dto';
import { CustomerJwtAuthGuard } from '../customer-auth/customer-jwt-auth.guard';

@Controller('wishlist')
@UseGuards(CustomerJwtAuthGuard)
export class WishlistController {
    constructor(private readonly wishlistService: WishlistService) {}

    @Get()
    getWishlist(@Req() req: any) {
        return this.wishlistService.getWishlist(req.user.customerId);
    }

    @Get(':productId/status')
    checkStatus(@Req() req: any, @Param('productId') productId: string) {
        return this.wishlistService.isWishlisted(req.user.customerId, +productId);
    }

    @Post(':productId')
    addItem(@Req() req: any, @Param('productId') productId: string, @Body() dto: AddWishlistItemDto) {
        return this.wishlistService.addItem(req.user.customerId, +productId, dto.variantId);
    }

    @Delete(':productId')
    removeItem(@Req() req: any, @Param('productId') productId: string) {
        return this.wishlistService.removeItem(req.user.customerId, +productId);
    }
}