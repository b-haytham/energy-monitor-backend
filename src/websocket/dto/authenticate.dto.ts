import { IsJWT } from 'class-validator';

export class AuthenticateDto {
  @IsJWT()
  access_token: string;
}
