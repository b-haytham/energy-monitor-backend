import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  Put,
  Req,
  Patch,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import {
  UpdateSubscriptionDto,
  UpdateSubscriptionInfoDto,
} from './dto/update-subscription.dto';
import { ValidationPipe } from '@nestjs/common';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/users/entities/user.entity';
import { QuerySubscriptionsDto } from './dto/query-subscriptions.dto';
import { Request } from 'express';
import { FileSystemStoredFile, FormDataRequest } from 'nestjs-form-data';

import * as path from 'path';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post()
  create(@Body(ValidationPipe) createSubscriptionDto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(createSubscriptionDto);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get()
  findAll(@Query(ValidationPipe) query: QuerySubscriptionsDto) {
    return this.subscriptionsService.findAll(query);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query(ValidationPipe) query: QuerySubscriptionsDto,
  ) {
    return this.subscriptionsService.findById(id, query, {});
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionsService.update(id, updateSubscriptionDto);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUPER_USER)
  @FormDataRequest({ storage: FileSystemStoredFile })
  @Patch(':id/info')
  updateInfo(
    @Param('id') id: string,
    @Body(ValidationPipe) updateSubscriptionInfoDto: UpdateSubscriptionInfoDto,
    @Req() req: Request,
  ) {
    return this.subscriptionsService.updateSubscriptionInfo(
      id,
      updateSubscriptionInfoDto,
      { req },
    );
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: Request) {
    return this.subscriptionsService.remove(id, { req: request });
  }
}
