import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  ValidateNested,
  IsArray,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class VariantImageDto {
  @IsString()
  imageUrl: string;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class VariantDto {
  @IsObject()
  @IsOptional()
  attributes?: Record<string, string>;

  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => VariantImageDto)
  images?: VariantImageDto[];
}