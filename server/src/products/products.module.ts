import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProductsService } from "./products.service";
import { ProductsController } from "./products.controller";
import { Product } from "./entities/product.entity";
import { ProductVariant } from "./entities/product-variant.entity";
import { ProductVariantImage } from "./entities/product-variant-image.entity";
import { Category } from "../categories/entities/category.entity";
import  {AuthModule} from '../auth/auth.module';
import { Review } from '../reviews/entities/review.entity';

@Module({
  imports:[
    TypeOrmModule.forFeature([Product, ProductVariant, ProductVariantImage, Category, Review]),
    AuthModule,
  ],
  controllers:[ProductsController],
  providers:[ProductsService],
  exports:[TypeOrmModule],
})
export class ProductsModule{}