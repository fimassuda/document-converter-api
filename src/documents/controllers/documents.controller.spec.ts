import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from '../services/documents.service';
import { BadRequestException } from '@nestjs/common';
import { SupportedFileType } from '../enums/supported-file-type.enum';
import { Response } from 'express';
import { ConvertDocumentDto } from '../dto/convert-document.dto';

describe('DocumentsController', () => {
  let controller: DocumentsController;
  let service: DocumentsService;

  const mockResponse = {
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
  } as unknown as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [
        {
          provide: DocumentsService,
          useValue: {
            convert: jest.fn().mockResolvedValue('converted content'),
          },
        },
      ],
    }).compile();

    controller = module.get<DocumentsController>(DocumentsController);
    service = module.get<DocumentsService>(DocumentsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('convert', () => {
    const mockFile = {
      buffer: Buffer.from('test content'),
      originalname: 'test.txt',
    } as Express.Multer.File;

    it('should return 200 and converted content when successful', async () => {
      const dto: ConvertDocumentDto = {
        convertTo: SupportedFileType.JSON,
        convertFrom: SupportedFileType.XML,
      };

      await controller.convert(mockFile, dto, mockResponse);

      expect(service.convert).toHaveBeenCalledWith({
        content: 'test content',
        convertFrom: SupportedFileType.XML,
        convertTo: SupportedFileType.JSON,
        lineSeparator: undefined,
        elementSeparator: undefined,
      });
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalledWith('converted content');
    });

    it('should handle direct content input', async () => {
      const dto: ConvertDocumentDto = {
        content: 'direct content',
        convertTo: SupportedFileType.JSON,
        convertFrom: SupportedFileType.XML,
      };

      await controller.convert(undefined, dto, mockResponse);

      expect(service.convert).toHaveBeenCalledWith({
        content: 'direct content',
        convertFrom: SupportedFileType.XML,
        convertTo: SupportedFileType.JSON,
        lineSeparator: undefined,
        elementSeparator: undefined,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 when neither file nor content is provided', async () => {
      const dto: ConvertDocumentDto = {
        convertTo: SupportedFileType.JSON,
        convertFrom: SupportedFileType.XML,
      };

      await expect(controller.convert(undefined, dto, mockResponse)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return 400 when converting to STRING without required parameters', async () => {
      const dto: ConvertDocumentDto = {
        content: 'test',
        convertTo: SupportedFileType.STRING,
        convertFrom: SupportedFileType.XML,
        lineSeparator: '~',
      };

      await expect(controller.convert(undefined, dto, mockResponse)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return 400 when error converting document', async () => {
      const dto: ConvertDocumentDto = {
        convertTo: SupportedFileType.JSON,
        convertFrom: SupportedFileType.XML,
      };

      (service.convert as jest.Mock).mockRejectedValue(new BadRequestException('Error converting document'));

      await expect(controller.convert(mockFile, dto, mockResponse)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
