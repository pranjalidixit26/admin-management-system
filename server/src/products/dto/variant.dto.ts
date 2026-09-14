import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  ValidateNested,
  IsArray,
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
  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  size?: string;

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