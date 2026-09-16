import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    Req,
} from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { CustomerJwtAuthGuard } from '../customer-auth/customer-jwt-auth.guard';

@Controller('addresses')
@UseGuards(CustomerJwtAuthGuard)
export class AddressesController {
    constructor(private readonly addressesService: AddressesService) {}

    @Get()
    findAll(@Req() req: any) {
        return this.addressesService.findAll(req.user.customerId);
    }

    @Post()
    create(@Req() req: any, @Body() dto: CreateAddressDto) {
        return this.addressesService.create(req.user.customerId, dto);
    }

    @Patch(':id')
    update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateAddressDto) {
        return this.addressesService.update(req.user.customerId, +id, dto);
    }

    @Delete(':id')
    remove(@Req() req: any, @Param('id') id: string) {
        return this.addressesService.remove(req.user.customerId, +id);
    }

    @Patch(':id/default')
    setDefault(@Req() req: any, @Param('id') id: string) {
        return this.addressesService.setDefault(req.user.customerId, +id);
    }
}