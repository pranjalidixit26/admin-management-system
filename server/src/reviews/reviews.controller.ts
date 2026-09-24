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
import { ReviewsService } from './reviews.service';
import { AddReviewDto } from './dto/add-review.dto';
import { CustomerJwtAuthGuard } from '../customer-auth/customer-jwt-auth.guard';

@Controller('reviews')
export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) {}

    @Get('product/:productId')
    getReviewsForProduct(@Param('productId') productId: string) {
        return this.reviewsService.getReviewsForProduct(+productId);
    }

    @Get('product/:productId/eligibility')
    @UseGuards(CustomerJwtAuthGuard)
    checkEligibility(@Req() req: any, @Param('productId') productId: string) {
        return this.reviewsService.checkEligibility(req.user.customerId, +productId);
    }

    @Post(':productId')
    @UseGuards(CustomerJwtAuthGuard)
    addReview(@Req() req: any, @Param('productId') productId: string, @Body() dto: AddReviewDto) {
        return this.reviewsService.addReview(req.user.customerId, +productId, dto.rating, dto.comment ?? null);
    }

    @Delete(':reviewId')
    @UseGuards(CustomerJwtAuthGuard)
    deleteReview(@Req() req: any, @Param('reviewId') reviewId: string) {
        return this.reviewsService.deleteReview(+reviewId, req.user.customerId);
    }
}