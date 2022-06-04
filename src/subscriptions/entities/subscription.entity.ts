import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { UserDocument } from 'src/users/entities/user.entity';

import * as mongoose from 'mongoose';
import * as mongooseAutopopulate from 'mongoose-autopopulate';
import { DeviceDocument } from 'src/devices/entities/device.entity';

export type SubscriptionDocument = mongoose.Document & Subscription;

export type Address = {
  street: string;
  city: string;
  state: string;
  country: string;
  zip: string;
};

export type CompanyInfo = {
  name: string;
  email: string;
  phone: string;
  address: Address;
};

const AddressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  country: String,
  zip: Number,
});

const CompanyInfoSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  address: AddressSchema,
});

@Schema({ timestamps: true })
export class Subscription {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    // autopopulate: true,
  })
  admin: string | UserDocument;

  @Prop({ schema: CompanyInfoSchema, required: true, type: mongoose.Schema })
  company_info: CompanyInfo;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] })
  users: string[] | UserDocument[];

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Device' }] })
  devices: string[] | DeviceDocument[];

  @Prop({ default: false })
  blocked: boolean;
}

const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
SubscriptionSchema.plugin(mongooseAutopopulate);

export { SubscriptionSchema };
