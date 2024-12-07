import { Injectable, Logger } from '@nestjs/common';
import { ConvertTo } from '../enums/convert-to.enum';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  async convertDocument(
    file: Express.Multer.File,
    convertTo: ConvertTo,
    lineSeparator?: string,
    elementSeparator?: string,
  ): Promise<Buffer> {
    this.logger.log(`Converting document to ${convertTo}`);
    
    // TODO: Implement conversion logic
    return file.buffer;
  }
}
