import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Req,
    UseGuards,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
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
    addItem(@Req() req: any, @Param('productId') productId: string) {
        return this.wishlistService.addItem(req.user.customerId, +productId);
    }

    @Delete(':productId')
    removeItem(@Req() req: any, @Param('productId') productId: string) {
        return this.wishlistService.removeItem(req.user.customerId, +productId);
    }
}