import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UserRole } from 'src/users/entities/user.entity';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-user.dto';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPER_USER)
  @Post('register')
  register(
    @Body(ValidationPipe) createUserDto: CreateUserDto,
    @Req() request: Request,
  ) {
    return this.authService.register(createUserDto, { req: request });
  }

  @Post('login')
  async login(
    @Body(ValidationPipe) loginUserDto: LoginUserDto,
    @Req() request: Request,
  ) {
    const res = await this.authService.login(loginUserDto);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    request.session['access_token'] = res.access_token;
    return res;
  }

  @Post('logout')
  async logout(@Req() request: Request) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    request.session = null;
    return {};
  }
}
