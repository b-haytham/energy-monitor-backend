import {
  IsEmail,
  IsEnum,
  IsMongoId,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @IsString()
  first_name: string;

  @IsString()
  last_name: string;

  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;

  @IsString()
  phone: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsMongoId()
  @ValidateIf((_, value) => value !== null)
  subscription: string | null;
}
