import { ConvertTo } from '../enums/convert-to.enum';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ConvertDocumentDto {
  @IsEnum(ConvertTo)
  convertTo: ConvertTo;

  @IsOptional()
  @IsString()
  lineSeparator?: string;

  @IsOptional()
  @IsString()
  elementSeparator?: string;
}
