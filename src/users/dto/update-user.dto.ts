import { PickType } from '@nestjs/mapped-types';
import { IsBoolean } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends CreateUserDto {
  @IsBoolean()
  blocked: boolean;
}

export class UpdateUserInfoDto extends PickType(UpdateUserDto, [
  'first_name',
  'last_name',
]) {}
