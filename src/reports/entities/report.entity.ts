import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { SubscriptionDocument } from 'src/subscriptions/entities/subscription.entity';

import * as mongoose from 'mongoose';

export type ReportDocument = Report & mongoose.Document;

export type ReportItem = {
  device: string;
  device_name: string;
  consumed: number;
  cost: number;
};

export type ReportFile = {
  name: string;
  path: string;
  url: string;
};
//
// const ReportItemSchema = new mongoose.Schema({
//   device: { type: mongoose.Schema.Types.ObjectId, ref: 'Device' },
//   device_name: String,
//   total: Number,
//   cost: Number,
// });

@Schema({ timestamps: true })
export class Report {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' })
  subscription: string | SubscriptionDocument;

  @Prop()
  items: ReportItem[];

  @Prop()
  total: number;

  @Prop()
  cost: number;

  @Prop(
    raw({
      name: String,
      path: String,
      url: String,
      // eslint-disable-next-line prettier/prettier
    })
  )
  file: ReportFile;

  @Prop()
  date: Date;
}

const ReportSchema = SchemaFactory.createForClass(Report);

export { ReportSchema };
