import { IsOptional, IsInt } from 'class-validator';

export class AddWishlistItemDto {
    @IsOptional()
    @IsInt()
    variantId?: number;
}