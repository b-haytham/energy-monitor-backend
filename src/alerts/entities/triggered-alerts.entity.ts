import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import * as mongoose from 'mongoose';
import { AlertDocument } from './alert.entity';

export type TriggeredAlertsDocument = TriggeredAlerts & mongoose.Document;

@Schema({ timestamps: true })
export class TriggeredAlerts {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Alert', required: true })
  alert: string | AlertDocument;

  @Prop({ reuired: true })
  value: number;
}

const TriggeredAlertsSchema = SchemaFactory.createForClass(TriggeredAlerts);

export { TriggeredAlertsSchema };
