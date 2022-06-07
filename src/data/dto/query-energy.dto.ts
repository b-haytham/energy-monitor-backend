import { IsIn, IsMongoId } from 'class-validator';

export class QueryEnergyDto {
  @IsMongoId()
  s: string; // subscription

  @IsMongoId()
  d: string; // device

  @IsIn(['1m', '6m', '1y', '2y', '1d', '15d'])
  t: string; // time
}
