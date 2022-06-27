import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UserRole } from 'src/users/entities/user.entity';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
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

  @UseGuards(RolesGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.SUPER_USER,
    UserRole.USER,
  )
  @Get('me')
  async verifyUser(@Req() request: Request) {
    return request.user;
  }

  @Post('forgot-password')
  async forgotPassword(
    @Body(ValidationPipe) forgotPasswordDto: ForgotPasswordDto,
  ) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  async resetPassword(
    @Body(ValidationPipe) resetPasswordDto: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @UseGuards(RolesGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.SUPER_USER,
    UserRole.USER,
  )
  @Post('change-password')
  async changePassword(
    @Body(ValidationPipe) changePasswordDto: ChangePasswordDto,
    @Req() request: Request,
  ) {
    return this.authService.changePassword(changePasswordDto, { req: request });
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post('devices/token-create')
  async createDeviceToken(@Body() data: { device: string }) {
    return await this.authService.createDeviceToken(data);
  }

  @Post('devices/token-verify')
  async verifyDeviceToken(@Body() data: { access_token: string }) {
    return await this.authService.verifyDeviceToken(data);
  }
}
