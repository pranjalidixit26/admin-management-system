import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../auth/permission.guard';
import { RequirePermission } from '../auth/require-permission.decorator';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import type { UploadedFileLike } from '../cloudinary/cloudinary.service';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('PRODUCT_CREATE')
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Post('upload-image')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('PRODUCT_CREATE')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (req, file, cb) => {
        const allowedExtensions = /\.(jpg|jpeg|png|webp|gif)$/i;
        const isValidMimetype = file.mimetype.startsWith('image/');
        const isValidExtension = allowedExtensions.test(file.originalname);
        if (!isValidMimetype && !isValidExtension) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadImage(@UploadedFile() file: UploadedFileLike) {
    const result = await this.cloudinaryService.uploadImage(file);
    return { imageUrl: result.secure_url, publicId: result.public_id };
  }

  @Get('public')
  findPublic(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('sort') sort?: string,
    @Query('attributes') attributes?: string,
  ) {
    let parsedAttributes: Record<string, string[]> | undefined;
    if (attributes) {
      try {
        parsedAttributes = JSON.parse(attributes);
      } catch {
        parsedAttributes = undefined;
      }
    }

    return this.productsService.findPublic(
      page ? +page : 1,
      limit ? +limit : 12,
      search,
      categoryId ? +categoryId : undefined,
      sort,
      parsedAttributes,
    );
  }

  @Get('public/filters')
  getPublicFilters(@Query('categoryId') categoryId?: string) {
    return this.productsService.getPublicFilters(
      categoryId ? +categoryId : undefined,
    );
  }

  @Get('public/:id')
  findOnePublic(@Param('id') id: string) {
    return this.productsService.findOnePublic(+id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.productsService.findAll(
      page ? +page : 1,
      limit ? +limit : 10,
      search,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  @Patch('variants/:variantId/stock')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('PRODUCT_EDIT')
  adjustVariantStock(
    @Param('variantId') variantId: string,
    @Body() dto: AdjustStockDto,
  ) {
    return this.productsService.adjustVariantStock(+variantId, dto.delta);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('PRODUCT_EDIT')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(+id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('PRODUCT_DELETE')
  remove(@Param('id') id: string) {
    return this.productsService.remove(+id);
  }
}