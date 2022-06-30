import { Type } from 'class-transformer';
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';
import { AlertCondition } from '../entities/alert.entity';

class If {
  @IsEnum(AlertCondition)
  condition: AlertCondition;

  @IsNumber()
  value: number;
}

export class CreateAlertDto {
  @IsMongoId()
  device: string;

  @IsString()
  @IsNotEmpty()
  value_name: string;

  @IsObject()
  @ValidateNested()
  @Type(() => If)
  if: If;
}
