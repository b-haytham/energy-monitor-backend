import { Request } from 'express';
import * as mongoose from 'mongoose';

export type FindOptions = {
  req?: Request;
  session?: mongoose.ClientSession;
};

export type ReqOptions = {
  req: Request;
  session?: mongoose.ClientSession;
};
