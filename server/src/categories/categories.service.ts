import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, IsNull } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

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
    return this.categoryRepository.save(category);
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
    return this.categoryRepository.find({
      where: { parentId: IsNull() },
      relations: { subcategories: true },
      order: { id: 'ASC' },
    });
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
    return this.categoryRepository.save(category);
  }

  async remove(id: number): Promise<void> {
    const category = await this.findOne(id);
    await this.categoryRepository.remove(category);
  }
}