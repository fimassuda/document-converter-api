// DocumentsService.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsService } from '../services/documents.service';
import { StringAdapter } from '../adapters/string.adapter';
import { JSONAdapter } from '../adapters/json.adapter';
import { XMLAdapter } from '../adapters/xml.adapter';
import { SupportedFileType } from '../enums/supported-file-type.enum';
import { BadRequestException } from '@nestjs/common';

describe('DocumentsService', () => {
  let service: DocumentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: StringAdapter, useValue: {
          setSeparators: jest.fn(),
          toCanonical: jest.fn(
            (input) => {
              return {
                metadata: {
                  format: SupportedFileType.STRING,
                  lineSeparator: '~',
                  elementSeparator: '*',
                },
                content: input,
              };
            }
          ),
          fromCanonical: jest.fn((canonicalModel) => {
            return canonicalModel.content;
          }),
        } },
        { provide: JSONAdapter, useValue: {} },
        { provide: XMLAdapter, useValue: {} },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should convert document', async () => {
    const result = await service.convert({
      content: 'content',
      convertFrom: SupportedFileType.STRING,
      convertTo: SupportedFileType.STRING,
      lineSeparator: '~',
      elementSeparator: '*',
    });
    expect(result).toBe('content');
  });

  it('should throw error if adapter not found', async () => {
    await expect(service.convert({
      content: 'content',
      convertFrom: 'INVALID' as SupportedFileType,
      convertTo: SupportedFileType.STRING,
      lineSeparator: '~',
      elementSeparator: '*',
    })).rejects.toThrow(BadRequestException);
  });
});
