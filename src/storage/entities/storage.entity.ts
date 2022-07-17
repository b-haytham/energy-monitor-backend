import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import * as mongoose from 'mongoose';
import { DeviceDocument } from 'src/devices/entities/device.entity';
import { SubscriptionDocument } from 'src/subscriptions/entities/subscription.entity';

export enum StorageSourceValue {
  POWER = 'p',
  ENERGIE = 'e',
}

export type StorageDocument = Storage & mongoose.Document;

@Schema({ _id: false })
export class StorageSource {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true,
    index: true,
  })
  s: string | SubscriptionDocument;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true,
    index: true,
  })
  d: string | DeviceDocument;

  @Prop({ required: true, enum: StorageSourceValue, index: true })
  v: StorageSourceValue;
}

@Schema({ timeseries: { timeField: 't', metaField: 's' } })
export class Storage {
  @Prop({ type: StorageSource, index: true })
  s: StorageSource;

  @Prop()
  v: number;

  @Prop()
  t: Date;
}

const StorageSchema = SchemaFactory.createForClass(Storage);

export { StorageSchema };
