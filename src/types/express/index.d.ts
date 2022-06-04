import { DeviceDocument } from 'src/devices/entities/device.entity';
import { SubscriptionDocument } from 'src/subscriptions/entities/subscription.entity';
import { UserDocument } from 'src/users/entities/user.entity';

declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
      subscription?: SubscriptionDocument;
      device?: DeviceDocument;
    }
  }
}
