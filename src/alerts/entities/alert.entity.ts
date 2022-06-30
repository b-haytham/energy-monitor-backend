import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';

import * as mongoose from 'mongoose';
import { DeviceDocument } from 'src/devices/entities/device.entity';

import { UserDocument } from 'src/users/entities/user.entity';

export type AlertDocument = Alert & mongoose.Document;

export enum AlertCondition {
  GREATER_THAN = '>',
  EQUALS = '=',
  LESS_THAN = '<',
}

// "if" field
export type If = {
  condition: AlertCondition;
  value: number;
};

@Schema({ timestamps: true })
export class Alert {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user: string | UserDocument;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true })
  device: string | DeviceDocument;

  @Prop({ requird: true })
  value_name: string;

  @Prop(
    raw({
      condition: { type: String, enum: AlertCondition, required: true },
      value: { type: Number, required: true },
    }),
  )
  if: If;

  @Prop({ default: 0 })
  trigger_count: number;
}

const AlertSchema = SchemaFactory.createForClass(Alert);

export { AlertSchema };
