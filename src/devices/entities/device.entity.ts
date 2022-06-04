import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';

import { SubscriptionDocument } from 'src/subscriptions/entities/subscription.entity';

import * as mongoose from 'mongoose';

export type DeviceDocument = Device & mongoose.Document;

export enum DeviceType {
  PV = 'PV',
  TRI = 'TRI',
  MONO = 'MONO',
}

export type LatestValue = {
  value: number | null;
  timestamp: string | null;
};

export type ValueDocument = Value & mongoose.Document;

@Schema()
export class Value {
  @Prop()
  name: string;

  @Prop()
  description: string;

  @Prop()
  accessor: string;

  @Prop()
  unit: string;

  @Prop(raw({ value: Number, timestamp: Date }))
  latest_value: LatestValue;
}

export const ValueSchema = SchemaFactory.createForClass(Value);

@Schema({ timestamps: true })
export class Device {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, enum: DeviceType })
  type: DeviceType;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true,
  })
  subscription: string | SubscriptionDocument;

  @Prop({ default: 0 })
  energie: number;

  @Prop({ default: 0 })
  power: number;

  @Prop({ type: [ValueSchema], autopopulate: true })
  values: Value[];

  @Prop({ default: false })
  blocked: boolean;
}

const DeviceSchema = SchemaFactory.createForClass(Device);

export { DeviceSchema };
