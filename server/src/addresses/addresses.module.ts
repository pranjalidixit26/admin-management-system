import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Address } from './address.entity';
import { AddressesService } from './addresses.service';
import { AddressesController } from './addresses.controller';
import { CustomerAuthModule } from '../customer-auth/customer-auth.module';

@Module({
    imports: [TypeOrmModule.forFeature([Address]), CustomerAuthModule],
    controllers: [AddressesController],
    providers: [AddressesService],
})
export class AddressesModule {}