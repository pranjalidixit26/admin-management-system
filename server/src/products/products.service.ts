import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductVariantImage } from './entities/product-variant-image.entity';
import { Category } from '../categories/entities/category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { VariantDto } from './dto/variant.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly productVariantRepository: Repository<ProductVariant>,
    @InjectRepository(ProductVariantImage)
    private readonly productVariantImageRepository: Repository<ProductVariantImage>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

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
        color: null,
        size: null,
        stock: savedProduct.stock,
        price: null,
      });
      await this.productVariantRepository.save(defaultVariant);
    }

    return savedProduct;
  }

  async findAll(page = 1, limit = 10, search?: string) {
    const [data, total] = await this.productRepository.findAndCount({
      where: search ? { name: Like(`%${search}%`) } : {},
      relations: { category: true },
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'ASC' },
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
      relations: { category: true },
    });
    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    return product;
  }

  async findPublic(page = 1, limit = 12, search?: string, categoryId?: number) {
    const where: any = { status: true };
    if (search) where.name = Like(`%${search}%`);

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

    const [data, total] = await this.productRepository.findAndCount({
      where,
      relations: { category: true },
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'DESC' },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id: number, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    const { categoryId, variants, ...rest } = updateProductDto;
    Object.assign(product, rest);
    if (categoryId) {
      product.category = { id: categoryId } as any;
    }
    const savedProduct = await this.productRepository.save(product);

    if (variants) {
      // replace-all: delete existing variants (cascades to their images), then re-insert
      await this.productVariantRepository.delete({ productId: savedProduct.id });

      if (variants.length > 0) {
        await this.saveVariants(savedProduct, variants);
      }
    }

    return savedProduct;
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
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
        color: v.color ?? null,
        size: v.size ?? null,
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