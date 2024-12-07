import { StringAdapter } from './string.adapter';
import { CanonicalModel } from '../models/canonical.model';
import { BadRequestException } from '@nestjs/common';

describe('StringAdapter', () => {
  let adapter: StringAdapter;

  beforeEach(() => {
    adapter = new StringAdapter();
  });

  describe('toCanonical', () => {
    it('should convert string content to canonical model', () => {
      adapter.setSeparators('~', '*');
      const input = 'ProductID*4*8*15*16*23~AddressID*42*108*3*14~ContactID*59*26';
      const result = adapter.toCanonical(input);

      expect(result).toBeInstanceOf(CanonicalModel);
      expect(result.metadata).toEqual({
        format: 'STRING',
        lineSeparator: '~',
        elementSeparator: '*',
      });
      expect(result.content).toEqual([
        ['ProductID', '4', '8', '15', '16', '23'],
        ['AddressID', '42', '108', '3', '14'],
        ['ContactID', '59', '26'],
      ]);
    });

    it('should handle empty input', () => {
      adapter.setSeparators('~', '*');
      const result = adapter.toCanonical('');
      expect(result.content).toEqual([]);
      expect(result.metadata).toEqual({
        format: 'STRING',
        lineSeparator: '~',
        elementSeparator: '*',
      });
    });

    it('should handle single line input', () => {
      adapter.setSeparators('~', '*');
      const result = adapter.toCanonical('a*b*c');
      expect(result.content).toEqual([['a', 'b', 'c']]);
      expect(result.metadata).toEqual({
        format: 'STRING',
        lineSeparator: '~',
        elementSeparator: '*',
      });
    });

    it('should throw error when separators are not set', () => {
      adapter = new StringAdapter();
      expect(() => adapter.toCanonical('a,b\nc,d')).toThrow(BadRequestException);
    });

    it('should trim whitespace from elements', () => {
      adapter.setSeparators('~', '*');
      const result = adapter.toCanonical(' a * b * c ~  d * e * f ');
      expect(result.content).toEqual([
        ['a', 'b', 'c'],
        ['d', 'e', 'f']
      ]);
    });

    it('should handle whitespace-only input', () => {
      adapter.setSeparators('~', '*');
      const result = adapter.toCanonical('   \n  \t  ');
      expect(result.content).toEqual([]);
    });

    it('should handle input with empty lines', () => {
      adapter.setSeparators('~', '*');
      const input = 'a*b~~c*d~\n~e*f';
      const result = adapter.toCanonical(input);
      expect(result.content).toEqual([
        ['a', 'b'],
        ['c', 'd'],
        ['e', 'f']
      ]);
    });

    it('should preserve empty elements in arrays', () => {
      adapter.setSeparators('~', '*');
      const input = 'a**b*~c*d**~**e';
      const result = adapter.toCanonical(input);
      expect(result.content).toEqual([
        ['a', '', 'b', ''],
        ['c', 'd', '', ''],
        ['', '', 'e']
      ]);
    });

    it('should handle special characters in separators', () => {
      adapter.setSeparators('\n', '\t');
      const input = 'a\tb\nc\td';
      const result = adapter.toCanonical(input);
      expect(result.content).toEqual([
        ['a', 'b'],
        ['c', 'd']
      ]);
    });
  });

  describe('fromCanonical', () => {
    it('should convert canonical model to string format', () => {
      adapter.setSeparators('~', '*');
      const canonicalModel = new CanonicalModel({
        metadata: {
          format: 'STRING',
          lineSeparator: '~',
          elementSeparator: '*',
        },
        content: [
          ['ProductID', '4', '8', '15', '16', '23'],
          ['AddressID', '42', '108', '3', '14'],
          ['ContactID', '59', '26'],
        ],
      });

      const result = adapter.fromCanonical(canonicalModel);
      expect(result).toBe('ProductID*4*8*15*16*23~AddressID*42*108*3*14~ContactID*59*26');
    });

    it('should handle empty content', () => {
      adapter.setSeparators('~', '*');
      const canonicalModel = new CanonicalModel({
        metadata: { format: 'STRING' },
        content: [],
      });

      const result = adapter.fromCanonical(canonicalModel);
      expect(result).toBe('');
    });

    it('should throw error for invalid content', () => {
      adapter.setSeparators('~', '*');
      expect(() => adapter.fromCanonical(null)).toThrow(BadRequestException);
      expect(() => adapter.fromCanonical(undefined)).toThrow(BadRequestException);
      expect(() => adapter.fromCanonical({ content: 'invalid' } as any)).toThrow(BadRequestException);
    });

    it('should throw error when separators are not set', () => {
      adapter = new StringAdapter();
      const canonicalModel = new CanonicalModel({
        metadata: { format: 'STRING' },
        content: [['a', 'b'], ['c', 'd']],
      });
      expect(() => adapter.fromCanonical(canonicalModel)).toThrow(BadRequestException);
    });
  });

  describe('setSeparators', () => {
    it('should update separators', () => {
      adapter.setSeparators('|', ';');
      const result = adapter.toCanonical('a;b|c;d');
      expect(result.metadata).toEqual({
        format: 'STRING',
        lineSeparator: '|',
        elementSeparator: ';',
      });
    });

    it('should throw error when separators are not provided', () => {
      expect(() => adapter.setSeparators('', '*')).toThrow(BadRequestException);
      expect(() => adapter.setSeparators('~', '')).toThrow(BadRequestException);
      expect(() => adapter.setSeparators('', '')).toThrow(BadRequestException);
    });

    it('should throw error when using the same character for both separators', () => {
      expect(() => adapter.setSeparators('|', '|')).toThrow(
        new BadRequestException('Line separator and element separator must be different')
      );
      // Verify separators were not set
      expect(() => adapter.toCanonical('a|b|c')).toThrow(
        new BadRequestException('Both line separator and element separator must be provided')
      );
    });
  });
});
