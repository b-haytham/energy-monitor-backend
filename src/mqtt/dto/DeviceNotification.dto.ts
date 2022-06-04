export type DeviceNotificationDto = {
  d: string; // device id
  p: Record<string, number>; // payload
  t: string; // timestamp
};
