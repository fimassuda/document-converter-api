import { SupportedFileType } from '../enums/supported-file-type.enum';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ConvertDocumentDto {
  @IsEnum(SupportedFileType)
  convertTo: SupportedFileType;

  @IsEnum(SupportedFileType)
  convertFrom: SupportedFileType;

  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  lineSeparator?: string;

  @IsOptional()
  @IsString()
  elementSeparator?: string;
}
