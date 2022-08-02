import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsNumberString,
  IsObject,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { FileSystemStoredFile, HasMimeType, IsFile } from 'nestjs-form-data';
import { AddressDto, CreateSubscriptionDto } from './create-subscription.dto';

export class UpdateSubscriptionDto extends PartialType(CreateSubscriptionDto) {}

export class UpdateSubscriptionInfoDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  email: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @IsOptional()
  @IsFile()
  @HasMimeType(['image/jpeg', 'image/png'])
  logo: FileSystemStoredFile;

  @IsNumberString()
  @ValidateIf((_, value) => value !== null)
  energie_cost: number | null;

  @IsString()
  @ValidateIf((_, value) => value !== null)
  currency: string | null;
}
