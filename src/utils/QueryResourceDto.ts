import { IsOptional, IsString } from 'class-validator';

export class QueryResourceDto {
  @IsOptional()
  @IsString()
  p?: string;
}
