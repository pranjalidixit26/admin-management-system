import { IsString, IsOptional, IsBoolean, IsNotEmpty } from "class-validator";

export class CreateCategoryDto{
    @IsString()
    @IsNotEmpty()
    name:string;

    @IsOptional()
    @IsString()
    description?:string;

    @IsOptional()
    @IsBoolean()
    status?:boolean;
}