import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { CLOUDINARY } from './cloudinary.provider';
import * as streamifier from 'streamifier';

export interface UploadedFileLike {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
    size: number;
}

@Injectable()
export class CloudinaryService {
    constructor(@Inject(CLOUDINARY) private readonly cloudinaryConfig: unknown) {}

    async uploadImage(file: UploadedFileLike): Promise<UploadApiResponse> {
        if (!file) {
            throw new BadRequestException('No file provided');
        }

        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder: 'shopnest/products' },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result as UploadApiResponse);
                },
            );
            streamifier.createReadStream(file.buffer).pipe(uploadStream);
        });
    }
}