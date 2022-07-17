import {
  Controller,
  Get,
  Body,
  Param,
  Delete,
  ValidationPipe,
  Put,
  UseGuards,
  Query,
  Req,
  Patch,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto, UpdateUserInfoDto } from './dto/update-user.dto';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from './entities/user.entity';
import { QueryUserDto } from './dto/query-user.dto';
import { Request } from 'express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // @Post()
  // create(@Body(ValidationPipe) createUserDto: CreateUserDto) {
  //   return this.usersService.create(createUserDto);
  // }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPER_USER)
  @Get()
  findAll(@Query(ValidationPipe) query: QueryUserDto, @Req() request: Request) {
    return this.usersService.findAll(query, { req: request });
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPER_USER)
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Req() request: Request,
    @Query() query: QueryUserDto,
  ) {
    return this.usersService.findById(id, query, { req: request });
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPER_USER)
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
    @Req() req: Request,
  ) {
    return this.usersService.update(id, updateUserDto, { req });
  }

  @UseGuards(RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.USER,
    UserRole.SUPER_USER,
  )
  @Patch(':id/info')
  updateInfo(
    @Param('id') id: string,
    @Body(ValidationPipe) updateUserInfoDto: UpdateUserInfoDto,
    @Req() req: Request,
  ) {
    return this.usersService.updateInfo(id, updateUserInfoDto, { req });
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPER_USER)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: Request) {
    return this.usersService.remove(id, { req: request });
  }
}
