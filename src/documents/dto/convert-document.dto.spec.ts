import { validate } from 'class-validator';
import { ConvertDocumentDto } from './convert-document.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SupportedFileType } from '../enums/supported-file-type.enum';

describe('ConvertDocumentDto', () => {
  let dto: ConvertDocumentDto;

  beforeEach(() => {
    dto = new ConvertDocumentDto();
  });

  describe('validation', () => {
    it('should validate a valid DTO', async () => {
      dto.convertTo = SupportedFileType.JSON;
      dto.convertFrom = SupportedFileType.XML;
      dto.content = '<root>test</root>';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should require convertTo', async () => {
      dto.convertFrom = SupportedFileType.XML;
      dto.content = '<root>test</root>';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('convertTo');
    });

    it('should require convertFrom', async () => {
      dto.convertTo = SupportedFileType.JSON;
      dto.content = '<root>test</root>';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('convertFrom');
    });

    it('should validate convertTo enum values', async () => {
      dto.convertTo = 'INVALID' as SupportedFileType;
      dto.convertFrom = SupportedFileType.XML;
      dto.content = '<root>test</root>';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('convertTo');
    });

    it('should validate convertFrom enum values', async () => {
      dto.convertTo = SupportedFileType.JSON;
      dto.convertFrom = 'INVALID' as SupportedFileType;
      dto.content = '<root>test</root>';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('convertFrom');
    });

    it('should allow optional separators', async () => {
      dto.convertTo = SupportedFileType.JSON;
      dto.convertFrom = SupportedFileType.STRING;
      dto.content = 'test';
      dto.lineSeparator = '~';
      dto.elementSeparator = '*';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate separator types are strings', async () => {
      dto.convertTo = SupportedFileType.JSON;
      dto.convertFrom = SupportedFileType.STRING;
      dto.content = 'test';
      dto.lineSeparator = 123 as any;
      dto.elementSeparator = true as any;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'lineSeparator')).toBe(true);
      expect(errors.some(e => e.property === 'elementSeparator')).toBe(true);
    });
  });
});
