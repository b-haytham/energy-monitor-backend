import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { UserDocument } from 'src/users/entities/user.entity';

import * as mongoose from 'mongoose';

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
  logo: {
    filename: string | null;
    path: string | null;
  };
  energie_cost: number | null;
  currency: string | null;
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
  logo: {
    filename: { type: String, default: null },
    path: { type: String, default: null },
  },
  energie_cost: { type: Number, default: null },
  currency: { type: String, default: null },
});

@Schema({ timestamps: true })
export class Subscription {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
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

export { SubscriptionSchema };
