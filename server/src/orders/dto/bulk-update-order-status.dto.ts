import { IsArray, ArrayNotEmpty, IsInt, IsEnum } from 'class-validator';
import { OrderStatus } from '../order.entity';

export class BulkUpdateOrderStatusDto {
    @IsArray()
    @ArrayNotEmpty()
    @IsInt({ each: true })
    orderIds: number[];

    @IsEnum(OrderStatus)
    status: OrderStatus;
}