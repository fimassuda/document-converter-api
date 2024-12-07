import { Module } from '@nestjs/common';
import { DocumentsController } from './controllers/documents.controller';
import { DocumentsService } from './services/documents.service';
import { StringAdapter } from './adapters/string.adapter';
import { JSONAdapter } from './adapters/json.adapter';
import { XMLAdapter } from './adapters/xml.adapter';

@Module({
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    StringAdapter,
    JSONAdapter,
    XMLAdapter,
  ],
})
export class DocumentsModule {}
