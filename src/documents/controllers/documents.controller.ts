import {
  BadRequestException,
  Body,
  Controller,
  Logger,
  ParseFilePipe,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { DocumentsService } from '../services/documents.service';
import { SupportedFileType } from '../enums/supported-file-type.enum';
import { ConvertDocumentDto } from '../dto/convert-document.dto';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  private readonly logger = new Logger(DocumentsController.name);

  private readonly contentTypeMap: Record<SupportedFileType, string> = {
    [SupportedFileType.STRING]: 'text/plain',
    [SupportedFileType.JSON]: 'application/json',
    [SupportedFileType.XML]: 'application/xml',
  };

  @Post('/convert')
  @UseInterceptors(FileInterceptor('file'))
  async convert(
    @UploadedFile(
      new ParseFilePipe({
        validators: [],
        fileIsRequired: false,
      }),
    )
    file: Express.Multer.File,
    @Body() convertDocumentDto: ConvertDocumentDto,
    @Res() res: Response,
  ) {
    let content: string;

    if (file) {
      content = file.buffer.toString('utf-8');
    } else if (convertDocumentDto.content) {
      content = convertDocumentDto.content;
    } else {
      throw new BadRequestException('Either file or content is required');
    }

    // Validate required parameters for STRING conversion
    if (convertDocumentDto.convertTo === SupportedFileType.STRING && (!convertDocumentDto.lineSeparator || !convertDocumentDto.elementSeparator)) {
      throw new BadRequestException('lineSeparator and elementSeparator are required when converting to STRING');
    }

    this.logger.log(`Converting ${file ? 'file' : 'content'} to ${convertDocumentDto.convertTo}`);

    try {
      const result = await this.documentsService.convert({
        content,
        convertFrom: convertDocumentDto.convertFrom,
        convertTo: convertDocumentDto.convertTo,
        lineSeparator: convertDocumentDto.lineSeparator,
        elementSeparator: convertDocumentDto.elementSeparator,
      });

      res.setHeader('Content-Type', this.contentTypeMap[convertDocumentDto.convertTo]);

      return res.status(200).send(result);
    } catch (error) {
      this.logger.error('Error converting document', error);
      throw new BadRequestException(error.message);
    }
  }
}
