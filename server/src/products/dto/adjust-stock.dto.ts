import { IsInt, NotEquals } from 'class-validator';

export class AdjustStockDto {
  @IsInt()
  @NotEquals(0)
  delta: number; // +5 = stock badhao, -3 = stock ghatao
}