import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SubscriptionDocument } from 'src/subscriptions/entities/subscription.entity';

import * as mongoose from 'mongoose';
import * as mongooseAutopopulate from 'mongoose-autopopulate';

export type UserDocument = mongoose.Document & User;

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  SUPER_ADMIN = 'super_admin',
  SUPER_USER = 'super_user',
}

@Schema({
  timestamps: true,
  toJSON: {
    transform: (_, ret) => {
      delete ret.password;
    },
  },
})
export class User {
  @Prop({ required: true })
  first_name: string;

  @Prop({ required: true })
  last_name: string;

  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  phone: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    autopopulate: true,
    default: null,
  })
  subscription: null | string | SubscriptionDocument;

  @Prop({ required: true, enum: UserRole })
  role: UserRole;

  @Prop({ required: true, default: false })
  verified: boolean;

  @Prop({ default: null })
  last_logged_in: Date;

  @Prop({ default: false })
  logged_in: boolean;
}

const UserSchema = SchemaFactory.createForClass(User);

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
UserSchema.plugin(mongooseAutopopulate);

export { UserSchema };
