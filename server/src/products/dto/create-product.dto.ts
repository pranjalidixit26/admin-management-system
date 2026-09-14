import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsNumber,
    Min,
    IsBoolean,
    IsArray,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { VariantDto } from './variant.dto';

export class CreateProductDto{
    @IsString()
    @IsNotEmpty()
    name:string;

    @IsString()
    @IsOptional()
    description?:string;

    @IsNumber()
    @Min(0)
    price:number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    stock?:number;

    @IsString()
    @IsOptional()
    imageUrl?:string;

    @IsNumber()
    @IsNotEmpty()
    categoryId:number;

    @IsBoolean()
    @IsOptional()
    status?:boolean;

    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => VariantDto)
    variants?: VariantDto[];
}