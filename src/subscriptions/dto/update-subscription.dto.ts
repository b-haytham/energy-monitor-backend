import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsNumberString,
  IsObject,
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

  @IsString()
  email: string;

  @IsString()
  phone: string;

  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

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
