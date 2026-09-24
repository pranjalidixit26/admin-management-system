import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { Order, OrderStatus } from '../orders/order.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewRepo: Repository<Review>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
  ) {}

  // Checks: has this customer received a DELIVERED order containing this product,
  // and have they already reviewed it?
  async checkEligibility(customerId: number, productId: number) {
    const deliveredOrderWithProduct = await this.orderRepo
      .createQueryBuilder('order')
      .innerJoin('order.items', 'item')
      .innerJoin('item.variant', 'variant')
      .where('order.customerId = :customerId', { customerId })
      .andWhere('order.status = :status', { status: OrderStatus.DELIVERED })
      .andWhere('variant.productId = :productId', { productId })
      .getOne();

    const existingReview = await this.reviewRepo.findOne({
      where: { customerId, productId },
    });

    return {
      hasPurchased: !!deliveredOrderWithProduct,
      alreadyReviewed: !!existingReview,
      canReview: !!deliveredOrderWithProduct && !existingReview,
    };
  }

  async addReview(
    customerId: number,
    productId: number,
    rating: number,
    comment: string | null,
  ) {
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const eligibility = await this.checkEligibility(customerId, productId);

    if (!eligibility.hasPurchased) {
      throw new ForbiddenException(
        'You can only review products you have purchased and received',
      );
    }
    if (eligibility.alreadyReviewed) {
      throw new ForbiddenException('You have already reviewed this product');
    }

    const review = this.reviewRepo.create({
      customerId,
      productId,
      rating,
      comment,
    });
    return this.reviewRepo.save(review);
  }

  async getReviewsForProduct(productId: number) {
    const reviews = await this.reviewRepo.find({
      where: { productId },
      relations: { customer: true },
      order: { created_at: 'DESC' },
    });

    const count = reviews.length;
    const averageRating =
      count > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / count
        : 0;

    return {
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        customerName: r.customer?.name ?? 'Anonymous',
        created_at: r.created_at,
      })),
      averageRating: Math.round(averageRating * 10) / 10,
      count,
    };
  }

  async deleteReview(reviewId: number, customerId: number) {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    if (review.customerId !== customerId) {
      throw new ForbiddenException('You can only delete your own review');
    }
    await this.reviewRepo.remove(review);
    return { success: true };
  }
}