import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
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
}
