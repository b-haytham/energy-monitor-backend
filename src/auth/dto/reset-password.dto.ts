import { IsJWT, IsMongoId, IsNotEmpty, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsJWT()
  token: string;

  @IsMongoId()
  user: string;

  @MinLength(6)
  @IsNotEmpty()
  password: string;
}
