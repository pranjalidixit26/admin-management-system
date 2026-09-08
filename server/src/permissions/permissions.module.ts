import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Permission]), AuthModule],
  controllers: [PermissionsController],
  providers: [PermissionsService],
  exports: [TypeOrmModule],
})
export class PermissionsModule {}