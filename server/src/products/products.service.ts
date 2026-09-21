import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
  Logger,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In, EntityManager } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductVariantImage } from './entities/product-variant-image.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { Category } from '../categories/entities/category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { VariantDto } from './dto/variant.dto';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';

const PRODUCTS_VERSION_KEY = 'products:version';
const FILTERS_TTL = 3600; 
const PUBLIC_LIST_TTL = 3600; 

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly productVariantRepository: Repository<ProductVariant>,
    @InjectRepository(ProductVariantImage)
    private readonly productVariantImageRepository: Repository<ProductVariantImage>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {}

  // Version badhne se saari purani products/filters cache keys unreachable ho jaati hain
  private async getCacheVersion(): Promise<string> {
    try {
      return (await this.redis.get(PRODUCTS_VERSION_KEY)) ?? '0';
    } catch (err) {
      this.logger.warn(`Redis read failed: ${(err as Error).message}`);
      return '0';
    }
  }

  private async bumpCacheVersion() {
    try {
      await this.redis.incr(PRODUCTS_VERSION_KEY);
    } catch (err) {
      this.logger.warn(`Could not bump ${PRODUCTS_VERSION_KEY}: ${(err as Error).message}`);
    }
  }

  private async getCached(key: string): Promise<any | null> {
    try {
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (err) {
      this.logger.warn(`Redis read failed: ${(err as Error).message}`);
      return null;
    }
  }

  private async setCached(key: string, value: unknown, ttl: number) {
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
    } catch (err) {
      this.logger.warn(`Redis write failed: ${(err as Error).message}`);
    }
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const { categoryId, variants, ...rest } = createProductDto;
    const product = this.productRepository.create({
      ...rest,
      category: { id: categoryId },
    });
    const savedProduct = await this.productRepository.save(product);

    if (variants && variants.length > 0) {
      await this.saveVariants(savedProduct, variants);
    } else {
      // fallback: single default variant, same as before
      const defaultVariant = this.productVariantRepository.create({
        sku: `PROD-${savedProduct.id}-DEFAULT`,
        productId: savedProduct.id,
        attributes: null,
        stock: savedProduct.stock,
        price: null,
      });
      await this.productVariantRepository.save(defaultVariant);
    }

    await this.bumpCacheVersion();
    return savedProduct;
  }

  async findAll(page = 1, limit = 10, search?: string) {
    const [rows, total] = await this.productRepository.findAndCount({
      where: search ? { name: Like(`%${search}%`) } : {},
      relations: { category: true, variants: true },
      loadEagerRelations: false, // variants ke eager product/images admin list me nahi chahiye
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'ASC' },
    });

    // Admin ko asli sellable stock dikhao: variants ka sum.
    // Variants na hon to purana product-level stock fallback rahega.
    const data = rows.map((product) => {
      const variants = product.variants ?? [];
      return {
        ...product,
        stock:
          variants.length > 0
            ? variants.reduce((sum, v) => sum + (v.stock ?? 0), 0)
            : product.stock,
      };
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

    async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: { category: true, variants: { images: true } },
    });
    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    return product;
  }

  async findOnePublic(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id, status: true },
      relations: { category: true, variants: { images: true } },
    });
    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    return product;
  }

  async findPublic(
    page = 1,
    limit = 12,
    search?: string,
    categoryId?: number,
    sort?: string,
    attributes?: Record<string, string[]>,
  ): Promise<{ data: Product[]; total: number; page: number; limit: number; totalPages: number }> {
    // attributes ko sorted rakho taaki same filter hamesha same key banaye
    const normalizedAttributes = attributes
      ? Object.fromEntries(
          Object.entries(attributes)
            .filter(([, values]) => values && values.length > 0)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, values]) => [key, [...values].sort()]),
        )
      : undefined;

    const hash = createHash('md5')
      .update(JSON.stringify({ page, limit, search, categoryId, sort, attributes: normalizedAttributes }))
      .digest('hex');
    const version = await this.getCacheVersion();
    const cacheKey = `products:public:v${version}:${hash}`;

    const cached = await this.getCached(cacheKey);
    if (cached) return cached;

    const result = await this.findPublicFromDb(page, limit, search, categoryId, sort, attributes);
    await this.setCached(cacheKey, result, PUBLIC_LIST_TTL);
    return result;
  }

  private async findPublicFromDb(
    page = 1,
    limit = 12,
    search?: string,
    categoryId?: number,
    sort?: string,
    attributes?: Record<string, string[]>,
  ): Promise<{ data: Product[]; total: number; page: number; limit: number; totalPages: number }> {
    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoin('product.category', 'category')
      .where('product.status = :status', { status: true });

    if (search) {
      qb.andWhere(
        '(product.name LIKE :search OR category.name LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: categoryId },
        relations: { subcategories: true },
      });
      const categoryIds = category
        ? [category.id, ...category.subcategories.map((sub) => sub.id)]
        : [categoryId];
      qb.andWhere('category.id IN (:...categoryIds)', { categoryIds });
    }

    if (attributes) {
      Object.entries(attributes).forEach(([key, values], idx) => {
        if (!values || values.length === 0) return;
        const jsonPathParam = `attrJsonPath${idx}`;
        const valuesParam = `attrValues${idx}`;
        qb.andWhere(
          `EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = product.id AND JSON_UNQUOTE(JSON_EXTRACT(pv.attributes, :${jsonPathParam})) IN (:...${valuesParam}))`,
          { [jsonPathParam]: `$."${key}"`, [valuesParam]: values },
        );
      });
    }

    const total = await qb.getCount();

    qb.orderBy(
      sort === 'price_asc' || sort === 'price_desc' ? 'product.price' : 'product.id',
      sort === 'price_asc' ? 'ASC' : sort === 'price_desc' ? 'DESC' : 'DESC',
    );

    const idRows = await qb
      .select('product.id', 'id')
      .skip((page - 1) * limit)
      .take(limit)
      .getRawMany();
    const ids = idRows.map((r) => r.id);

    if (ids.length === 0) {
      return { data: [], total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    const data = await this.productRepository.find({
      where: { id: In(ids) },
      relations: { category: true, variants: { images: true } },
    });

    const orderIndex = new Map(ids.map((id, idx) => [id, idx]));
    data.sort((a, b) => orderIndex.get(a.id)! - orderIndex.get(b.id)!);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPublicFilters(categoryId?: number): Promise<Record<string, string[]>> {
    const version = await this.getCacheVersion();
    const cacheKey = `filters:v${version}:${categoryId ?? 'all'}`;

    // Cache HIT — return cached data, skip the DB entirely
    const cached = await this.getCached(cacheKey);
    if (cached) {
      return cached;
    }

    const where: any = { status: true };

    if (categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: categoryId },
        relations: { subcategories: true },
      });
      const categoryIds = category
        ? [category.id, ...category.subcategories.map((sub) => sub.id)]
        : [categoryId];
      where.category = { id: In(categoryIds) };
    }

    const products = await this.productRepository.find({
      where,
      relations: { variants: true },
    });

    const filterMap = new Map<string, Set<string>>();

    for (const product of products) {
      for (const variant of product.variants ?? []) {
        if (!variant.attributes) continue;
        for (const [key, value] of Object.entries(variant.attributes)) {
          if (!value) continue;
          if (!filterMap.has(key)) {
            filterMap.set(key, new Set());
          }
          filterMap.get(key)!.add(value);
        }
      }
    }

    const result: Record<string, string[]> = {};
    for (const [key, values] of filterMap.entries()) {
      result[key] = Array.from(values).sort();
    }

    // Cache MISS path — 1 ghanta ka TTL, product/variant/category change pe version badhne se invalidate
    await this.setCached(cacheKey, result, FILTERS_TTL);

    return result;
  }

  async update(id: number, updateProductDto: UpdateProductDto): Promise<Product> {
    const { categoryId, variants, ...rest } = updateProductDto;

    // Product aur variants ek transaction me, taaki error aane par half-save na ho
    const savedProduct = await this.productRepository.manager.transaction(
      async (manager) => {
        const product = await manager.findOne(Product, { where: { id } });
        if (!product) {
          throw new NotFoundException(`Product with id ${id} not found`);
        }

        Object.assign(product, rest);
        if (categoryId) {
          product.category = { id: categoryId } as any;
        }
        const saved = await manager.save(product);

        if (variants) {
          await this.syncVariants(manager, saved.id, variants);
        }
        return saved;
      },
    );

    // Invalidation DB commit ke baad
    await this.bumpCacheVersion();
    return savedProduct;
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
    await this.bumpCacheVersion();
  }

    // Stock delta se badalta hai (atomic), taaki form ka purana number live stock overwrite na kare
  async adjustVariantStock(variantId: number, delta: number) {
    const result = await this.productVariantRepository.query(
      'UPDATE product_variants SET stock = stock + ? WHERE id = ? AND stock + ? >= 0',
      [delta, variantId, delta],
    );

    if (!result?.affectedRows) {
      const exists = await this.productVariantRepository.findOne({
        where: { id: variantId },
        loadEagerRelations: false,
      });
      if (!exists) {
        throw new NotFoundException(`Variant with id ${variantId} not found`);
      }
      throw new BadRequestException(
        `Stock negative nahi ho sakta (abhi ${exists.stock}, change ${delta})`,
      );
    }

    await this.bumpCacheVersion();
    const updated = await this.productVariantRepository.findOne({
      where: { id: variantId },
      loadEagerRelations: false,
    });
    return { id: variantId, stock: updated?.stock ?? 0 };
  }

  private async syncVariants(
    manager: EntityManager,
    productId: number,
    incoming: VariantDto[],
  ): Promise<void> {
    const existing = await manager.find(ProductVariant, {
      where: { productId },
      loadEagerRelations: false,
    });
    const existingIds = new Set(existing.map((v) => v.id));
    const keepIds = new Set<number>();

    for (const v of incoming) {
      if (v.id === undefined) continue;
      if (!existingIds.has(v.id)) {
        throw new BadRequestException(`Variant ${v.id} is product ka nahi hai`);
      }
      keepIds.add(v.id);
    }

    // 1. Payload se hataye gaye variants delete karo.
    // Order/cart me use hua ho to FK error aata hai, use saaf message me badalte hain.
    const removeIds = existing.filter((v) => !keepIds.has(v.id)).map((v) => v.id);
    if (removeIds.length > 0) {
      // Cart transient hai: hataye ja rahe variants ke cart items pehle saaf karo.
      // Order items ko nahi chhedte, wo history hain (unka FK 409 dega).
      await manager
        .createQueryBuilder()
        .delete()
        .from(CartItem)
        .where('variant_id IN (:...ids)', { ids: removeIds })
        .execute();

      try {
        await manager.delete(ProductVariant, { id: In(removeIds) });
      } catch (err) {
        const errno = (err as any)?.driverError?.errno ?? (err as any)?.errno;
        if (errno === 1451) {
          throw new ConflictException(
            'Kisi variant ka order ya cart me use ho chuka hai, isliye delete nahi ho sakta. Stock 0 kar do.',
          );
        }
        throw err;
      }
    }

    // 2. Naye variants ke SKU: bache hue SKUs ka max suffix + 1
    const prefix = `PROD-${productId}-`;
    let nextSuffix =
      existing
        .filter((v) => keepIds.has(v.id))
        .reduce((max, v) => {
          const n = v.sku.startsWith(prefix) ? Number(v.sku.slice(prefix.length)) : NaN;
          return Number.isInteger(n) && n > max ? n : max;
        }, 0) + 1;

    // 3. Update ya create
    for (const v of incoming) {
      if (v.id !== undefined) {
        // Existing variant: stock jaan-boojh ke ignore, wo adjustVariantStock se badlega
        const patch: Record<string, unknown> = {};
        if (v.attributes !== undefined) {
          patch.attributes = Object.keys(v.attributes).length > 0 ? v.attributes : null;
        }
        if (v.price !== undefined) {
          patch.price = v.price;
        }
        if (Object.keys(patch).length > 0) {
          await manager.update(ProductVariant, v.id, patch as any);
        }
        if (v.images !== undefined) {
          await manager.delete(ProductVariantImage, { variantId: v.id });
          await this.saveVariantImages(manager, v.id, v.images);
        }
      } else {
        const variant = manager.create(ProductVariant, {
          sku: `${prefix}${nextSuffix++}`,
          productId,
          attributes: v.attributes && Object.keys(v.attributes).length > 0 ? v.attributes : null,
          stock: v.stock ?? 0, // naye variant ka starting stock
          price: v.price ?? null,
        });
        const savedVariant = await manager.save(variant);
        await this.saveVariantImages(manager, savedVariant.id, v.images);
      }
    }
  }

  private async saveVariantImages(
    manager: EntityManager,
    variantId: number,
    images?: { imageUrl: string; sortOrder?: number }[],
  ): Promise<void> {
    if (!images || images.length === 0) return;
    const rows = images.map((img, idx) =>
      manager.create(ProductVariantImage, {
        variantId,
        imageUrl: img.imageUrl,
        sortOrder: img.sortOrder ?? idx,
      }),
    );
    await manager.save(rows);
  }

  private async saveVariants(
    product: Product,
    variants: VariantDto[],
  ): Promise<void> {
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      const variant = this.productVariantRepository.create({
        sku: `PROD-${product.id}-${i + 1}`,
        productId: product.id,
        attributes: v.attributes && Object.keys(v.attributes).length > 0 ? v.attributes : null,
        stock: v.stock ?? 0,
        price: v.price ?? null,
      });
      const savedVariant = await this.productVariantRepository.save(variant);

      if (v.images && v.images.length > 0) {
        const images = v.images.map((img, idx) =>
          this.productVariantImageRepository.create({
            variantId: savedVariant.id,
            imageUrl: img.imageUrl,
            sortOrder: img.sortOrder ?? idx,
          }),
        );
        await this.productVariantImageRepository.save(images);
      }
    }
  }
}