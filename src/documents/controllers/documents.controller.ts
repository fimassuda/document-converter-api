import { BadRequestException, Body, Controller, Logger, ParseFilePipe, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { DocumentsService } from '../services/documents.service';
import { ConvertTo } from '../enums/convert-to.enum';
import { ConvertDocumentDto } from '../dto/convert-document.dto';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  private readonly logger = new Logger(DocumentsController.name);

  @Post('/convert')
  @UseInterceptors(FileInterceptor('file'))
  async convert(
    @UploadedFile(
      new ParseFilePipe({
        validators: [],
      }),
    )
    file: Express.Multer.File,
    @Body() convertDocumentDto: ConvertDocumentDto,
    @Res() res: Response,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    this.logger.log(`Converting file to ${convertDocumentDto.convertTo}`);

    // Validate convertTo parameter
    const normalizedConvertTo = convertDocumentDto.convertTo?.toUpperCase();
    if (!Object.values(ConvertTo).some(v => v === normalizedConvertTo)) {
      throw new BadRequestException(`Invalid convertTo value. Supported formats are: ${Object.values(ConvertTo).join(', ')}`);
    }

    // Validate required parameters for STRING conversion
    if (normalizedConvertTo === ConvertTo.STRING) {
      if (!convertDocumentDto.lineSeparator || !convertDocumentDto.elementSeparator) {
        throw new BadRequestException('lineSeparator and elementSeparator are required when converting to STRING');
      }
    }

    const convertedBuffer = await this.documentsService.convertDocument(
      file,
      normalizedConvertTo as ConvertTo,
      convertDocumentDto.lineSeparator,
      convertDocumentDto.elementSeparator,
    );

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename=${file.originalname}`);
    res.status(200).send(convertedBuffer);
    return res;
  }
}
