import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsMongoId,
  IsNumber,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ReportItem {
  @IsMongoId()
  device: string;

  @IsString()
  device_name: string;

  @IsNumber()
  @IsPositive()
  consumed: number;

  @IsNumber()
  @IsPositive()
  cost: number;

  constructor(item: any) {
    this.device = item.device;
    this.device_name = item.device_name;
    this.consumed = item.consumed;
    this.cost = item.cost;
  }
}

export class CreateReportDto {
  @IsMongoId()
  subscription: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReportItem)
  items: ReportItem[];

  @IsNumber()
  @IsPositive()
  total: number;

  @IsNumber()
  @IsPositive()
  cost: number;

  @IsString()
  pdf_path: string;

  @IsDate()
  date: Date;

  constructor(report: any) {
    this.cost = report.cost;
    this.date = report.date;
    this.total = report.total;
    this.subscription = report.subscription;
    this.pdf_path = report.pdf_path;
    this.items = report.items.map((it) => new ReportItem(it));
  }
}
