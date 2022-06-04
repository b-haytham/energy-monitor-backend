import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UsersService } from 'src/users/users.service';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  register(createUserDto: CreateUserDto) {
    // create user
    return this.usersService.create(createUserDto);
  }

  async login(loginUserDto: LoginUserDto) {
    // validate user email and password
    const user = await this.usersService.findByEmailAndPassword(
      loginUserDto.email,
      loginUserDto.password,
    );

    if (!user) {
      throw new BadRequestException('Wrong email or password');
    }

    const token = this.jwtService.sign({
      sub: user._id,
      email: user.email,
      role: user.role,
    });
    return { access_token: token, user };
  }
}
