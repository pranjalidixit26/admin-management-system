import { Module, Global } from '@nestjs/common';
import { CloudinaryProvider, CLOUDINARY } from './cloudinary.provider';
import { CloudinaryService } from './cloudinary.service';

@Global()
@Module({
    providers: [CloudinaryProvider, CloudinaryService],
    exports: [CLOUDINARY, CloudinaryService],
})
export class CloudinaryModule {}