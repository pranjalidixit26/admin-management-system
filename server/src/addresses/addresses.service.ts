import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './address.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
    constructor(
        @InjectRepository(Address)
        private addressRepo: Repository<Address>,
    ) {}

    async findAll(customerId: number) {
        return this.addressRepo.find({
            where: { customerId },
            order: { isDefault: 'DESC', created_at: 'DESC' },
        });
    }

    async create(customerId: number, dto: CreateAddressDto) {
        if (dto.isDefault) {
            await this.addressRepo.update({ customerId }, { isDefault: false });
        }
        const address = this.addressRepo.create({ ...dto, customerId });
        return this.addressRepo.save(address);
    }

    async update(customerId: number, id: number, dto: UpdateAddressDto) {
        const address = await this.getOwned(customerId, id);
        if (dto.isDefault) {
            await this.addressRepo.update({ customerId }, { isDefault: false });
        }
        Object.assign(address, dto);
        return this.addressRepo.save(address);
    }

    async remove(customerId: number, id: number) {
        const address = await this.getOwned(customerId, id);
        await this.addressRepo.remove(address);
        return { success: true };
    }

    async setDefault(customerId: number, id: number) {
        await this.getOwned(customerId, id);
        await this.addressRepo.update({ customerId }, { isDefault: false });
        await this.addressRepo.update({ id }, { isDefault: true });
        return this.findAll(customerId);
    }

    private async getOwned(customerId: number, id: number) {
        const address = await this.addressRepo.findOne({ where: { id } });
        if (!address) throw new NotFoundException('Address not found');
        if (address.customerId !== customerId) throw new ForbiddenException();
        return address;
    }
}