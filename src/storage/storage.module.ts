import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DevicesModule } from 'src/devices/devices.module';
import { Storage, StorageSchema } from './entities/storage.entity';
import { StorageService } from './storage.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Storage.name, schema: StorageSchema }]),
    DevicesModule,
  ],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
