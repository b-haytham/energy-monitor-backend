import { Type } from 'class-transformer';
import {
  IsMongoId,
  IsNumber,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';

export class AddressDto {
  @IsString()
  street: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  zip: string;
}

export class CompanyInfoDto {
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
}

export class CreateSubscriptionDto {
  @IsMongoId()
  admin: string;

  @IsObject()
  @ValidateNested()
  @Type(() => CompanyInfoDto)
  company_info: CompanyInfoDto;
}
