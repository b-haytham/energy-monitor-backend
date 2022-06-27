import { IsNotEmpty, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @MinLength(6)
  @IsNotEmpty()
  current: string;

  @MinLength(6)
  @IsNotEmpty()
  new: string;
}
