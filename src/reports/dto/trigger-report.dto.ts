import { IsMongoId } from 'class-validator';

export class TriggerReportDto {
  @IsMongoId()
  subscription: string;
}
