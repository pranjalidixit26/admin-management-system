import { Injectable, Inject, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, IsNull } from 'typeorm';
import { Redis } from 'ioredis';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

const CATEGORY_TREE_KEY = 'categories:tree';
const CATEGORY_TREE_TTL = 3600; // 1 ghanta, aur har write pe invalidate bhi hota hai

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  // Redis down ho to bhi API chalti rehni chahiye, isliye error sirf log hota hai
  private async invalidateTreeCache() {
    try {
      await this.redis.del(CATEGORY_TREE_KEY);
    } catch (err) {
      this.logger.warn(`Could not invalidate ${CATEGORY_TREE_KEY}: ${(err as Error).message}`);
    }
  }

  /**
   * Validates that a parentId, if provided, points to a valid TOP-LEVEL
   * category (2-level rule: a subcategory cannot itself have subcategories).
   */
  private async validateParent(parentId: number | undefined | null, selfId?: number) {
    if (parentId === undefined || parentId === null) return;

    if (selfId !== undefined && parentId === selfId) {
      throw new BadRequestException('A category cannot be its own parent');
    }

    const parent = await this.categoryRepository.findOne({ where: { id: parentId } });
    if (!parent) {
      throw new NotFoundException(`Parent category with id ${parentId} not found`);
    }

    if (parent.parentId !== null) {
      throw new BadRequestException(
        'Selected parent is already a subcategory. Only 2 levels are allowed (Category → Subcategory).',
      );
    }
  }

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    await this.validateParent(createCategoryDto.parentId);

    const category = this.categoryRepository.create(createCategoryDto);
    const saved = await this.categoryRepository.save(category);
    await this.invalidateTreeCache();
    return saved;
  }

  async findAll(page = 1, limit = 10, search?: string) {
    const [data, total] = await this.categoryRepository.findAndCount({
      where: search ? { name: Like(`%${search}%`) } : {},
      relations: { parent: true },
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

  /**
   * Returns top-level categories with their subcategories nested inside.
   * Useful for dropdowns (parent picker, product filters) and any
   * tree-style display.
   */
  async findTree(): Promise<Category[]> {
    try {
      const cached = await this.redis.get(CATEGORY_TREE_KEY);
      if (cached) return JSON.parse(cached) as Category[];
    } catch (err) {
      this.logger.warn(`Redis read failed: ${(err as Error).message}`);
    }

    const tree = await this.categoryRepository.find({
      where: { parentId: IsNull() },
      relations: { subcategories: true },
      order: { id: 'ASC' },
    });

    try {
      await this.redis.set(CATEGORY_TREE_KEY, JSON.stringify(tree), 'EX', CATEGORY_TREE_TTL);
    } catch (err) {
      this.logger.warn(`Redis write failed: ${(err as Error).message}`);
    }

    return tree;
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: { parent: true, subcategories: true },
    });
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);

    if (updateCategoryDto.parentId !== undefined) {
      await this.validateParent(updateCategoryDto.parentId, id);

      // A category that already has subcategories can't be turned into a subcategory itself
      if (updateCategoryDto.parentId !== null) {
        const childCount = await this.categoryRepository.count({ where: { parentId: id } });
        if (childCount > 0) {
          throw new BadRequestException(
            'This category has subcategories and cannot be made a subcategory itself.',
          );
        }
      }
    }

    Object.assign(category, updateCategoryDto);
    const saved = await this.categoryRepository.save(category);
    await this.invalidateTreeCache();
    return saved;
  }

  async remove(id: number): Promise<void> {
    const category = await this.findOne(id);
    await this.categoryRepository.remove(category);
    await this.invalidateTreeCache();
  }
}