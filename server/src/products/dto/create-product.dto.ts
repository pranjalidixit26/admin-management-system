import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsNumber,
    Min,
    IsBoolean,
    isNumber,
} from 'class-validator';

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
}