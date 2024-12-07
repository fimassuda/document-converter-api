import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from '../services/documents.service';
import { BadRequestException } from '@nestjs/common';
import { ConvertTo } from '../enums/convert-to.enum';
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
            convertDocument: jest.fn().mockResolvedValue(Buffer.from('test')),
          },
        },
      ],
    }).compile();

    controller = module.get<DocumentsController>(DocumentsController);
    service = module.get<DocumentsService>(DocumentsService);

    jest.clearAllMocks();
  });

  describe('convert', () => {
    const mockFile = {
      originalname: 'test.txt',
      buffer: Buffer.from('test'),
    } as Express.Multer.File;

    it('should require a file', async () => {
      const dto = new ConvertDocumentDto();
      dto.convertTo = ConvertTo.JSON;

      await expect(
        controller.convert(undefined, dto, mockResponse),
      ).rejects.toThrow(BadRequestException);
    });

    it('should require convertTo parameter', async () => {
      const dto = new ConvertDocumentDto();
      
      await expect(
        controller.convert(mockFile, dto, mockResponse),
      ).rejects.toThrow(BadRequestException);
    });

    it('should require lineSeparator and elementSeparator when convertTo is STRING', async () => {
      const dto = new ConvertDocumentDto();
      dto.convertTo = ConvertTo.STRING;

      await expect(
        controller.convert(mockFile, dto, mockResponse),
      ).rejects.toThrow(BadRequestException);

      dto.lineSeparator = '\n';
      await expect(
        controller.convert(mockFile, dto, mockResponse),
      ).rejects.toThrow(BadRequestException);

      dto.lineSeparator = undefined;
      dto.elementSeparator = ',';
      await expect(
        controller.convert(mockFile, dto, mockResponse),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate convertTo is in ConvertTo enum', async () => {
      const dto = new ConvertDocumentDto();
      dto.convertTo = 'INVALID' as ConvertTo;

      await expect(
        controller.convert(mockFile, dto, mockResponse),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return 200 and converted buffer when successful', async () => {
      const dto = new ConvertDocumentDto();
      dto.convertTo = ConvertTo.JSON;

      const result = await controller.convert(mockFile, dto, mockResponse);

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/octet-stream',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename=test.txt',
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should return 200 when converting to STRING with required parameters', async () => {
      const dto = new ConvertDocumentDto();
      dto.convertTo = ConvertTo.STRING;
      dto.lineSeparator = '\n';
      dto.elementSeparator = ',';

      const result = await controller.convert(mockFile, dto, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(result).toBeDefined();
      expect(service.convertDocument).toHaveBeenCalledWith(
        mockFile,
        ConvertTo.STRING,
        '\n',
        ','
      );
    });
  });
});
