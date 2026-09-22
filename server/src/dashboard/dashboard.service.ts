import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { Category } from '../categories/entities/category.entity';
import { Role } from '../roles/entities/role.entity';
import { OrdersService } from '../orders/orders.service';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';

const DASHBOARD_STATS_KEY = 'dashboard:stats';
const DASHBOARD_STATS_TTL = 120;
const LOW_STOCK_THRESHOLD = 5;

@Injectable()
export class DashboardService {
    private readonly logger = new Logger(DashboardService.name);

    constructor(
        @InjectRepository(User) private userRepo: Repository<User>,
        @InjectRepository(Product) private productRepo: Repository<Product>,
        @InjectRepository(ProductVariant) private variantRepo: Repository<ProductVariant>,
        @InjectRepository(Category) private categoryRepo: Repository<Category>,
        @InjectRepository(Role) private roleRepo: Repository<Role>,
        private ordersService: OrdersService,
        @Inject(REDIS_CLIENT) private readonly redis: Redis,
    ) {}

    async getStats() {
        try {
            const cached = await this.redis.get(DASHBOARD_STATS_KEY);
            if (cached) return JSON.parse(cached);
        } catch (err) {
            this.logger.warn(`Could not read ${DASHBOARD_STATS_KEY}: ${(err as Error).message}`);
        }

        const [totalUsers, totalProducts, totalCategories, totalRoles, orders] =
            await Promise.all([
                this.userRepo.count(),
                this.productRepo.count(),
                this.categoryRepo.count(),
                this.roleRepo.count(),
                this.ordersService.getStatsForAdmin(),
            ]);

        const lowStockCount = await this.variantRepo
            .createQueryBuilder('variant')
            .where('variant.stock < :threshold', { threshold: LOW_STOCK_THRESHOLD })
            .getCount();

        const inventoryResult = await this.variantRepo
            .createQueryBuilder('variant')
            .leftJoin('variant.product', 'product')
            .select(
                'COALESCE(SUM(variant.stock * COALESCE(variant.price, product.price)), 0)',
                'inventoryValue',
            )
            .getRawOne();

        const stats = {
            totalUsers,
            totalProducts,
            totalCategories,
            totalRoles,
            lowStockCount,
            inventoryValue: Number(inventoryResult.inventoryValue),
            orders,
        };

        try {
            await this.redis.set(
                DASHBOARD_STATS_KEY,
                JSON.stringify(stats),
                'EX',
                DASHBOARD_STATS_TTL,
            );
        } catch (err) {
            this.logger.warn(`Could not write ${DASHBOARD_STATS_KEY}: ${(err as Error).message}`);
        }

        return stats;
    }
}