import { IsString, IsOptional, IsNotEmpty, IsBoolean } from 'class-validator';

export class CreateAddressDto {
    @IsOptional()
    @IsString()
    label?: string;

    @IsNotEmpty()
    @IsString()
    addressLine: string;

    @IsNotEmpty()
    @IsString()
    city: string;

    @IsNotEmpty()
    @IsString()
    state: string;

    @IsNotEmpty()
    @IsString()
    pincode: string;

    @IsNotEmpty()
    @IsString()
    country: string;

    @IsNotEmpty()
    @IsString()
    phone: string;

    @IsOptional()
    @IsBoolean()
    isDefault?: boolean;
}