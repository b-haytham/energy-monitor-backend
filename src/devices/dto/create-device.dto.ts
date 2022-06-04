import { IsEnum, IsMongoId, IsString } from 'class-validator';
import { DeviceType } from '../entities/device.entity';

export class CreateDeviceDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsEnum(DeviceType)
  type: DeviceType;

  @IsMongoId()
  subscription: string;
}
