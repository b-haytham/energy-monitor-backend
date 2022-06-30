import { IsMongoId, IsNumber } from 'class-validator';

export class CreateTriggeredAlertDto {
  @IsMongoId()
  alert: string;

  @IsNumber()
  value: number;

  constructor(data: any) {
    this.alert = data.alert;
    this.value = data.value;
  }
}
