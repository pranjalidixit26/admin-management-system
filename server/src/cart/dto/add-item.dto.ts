import { IsInt, IsPositive, IsOptional } from 'class-validator';

export class AddItemDto {
    @IsInt()
    @IsPositive()
    variantId: number;

    @IsOptional()
    @IsInt()
    @IsPositive()
    quantity?: number = 1;
}