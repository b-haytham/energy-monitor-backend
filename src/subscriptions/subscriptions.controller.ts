import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { ValidationPipe } from '@nestjs/common';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  create(@Body(ValidationPipe) createSubscriptionDto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(createSubscriptionDto);
  }

  @Get()
  findAll() {
    return this.subscriptionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subscriptionsService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionsService.update(id, updateSubscriptionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subscriptionsService.remove(id);
  }
}
