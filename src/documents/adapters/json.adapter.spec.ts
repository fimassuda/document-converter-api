import { JSONAdapter } from './json.adapter';
import { CanonicalModel } from '../models/canonical.model';
import { BadRequestException } from '@nestjs/common';

describe('JSONAdapter', () => {
  let adapter: JSONAdapter;

  beforeEach(() => {
    adapter = new JSONAdapter();
  });

  describe('toCanonical', () => {
    it('should convert JSON content to canonical model', () => {
      const input = JSON.stringify({
        root: {
          item: [
            {
              id: '1',
              name: 'test',
              details: {
                type: 'example',
                value: '123'
              }
            }
          ]
        }
      });

      const result = adapter.toCanonical(input);

      expect(result).toBeInstanceOf(CanonicalModel);
      expect(result.metadata.format).toBe('JSON');
      expect(result.content).toEqual([
        ['item', 'example', '123', '1', 'test']
      ]);
    });

    it('should handle empty JSON object', () => {
      const result = adapter.toCanonical('{}');
      expect(result.content).toEqual([]);
      expect(result.metadata.format).toBe('JSON');
    });

    it('should handle simple JSON object', () => {
      const input = JSON.stringify({
        type: 'test',
        value: '123'
      });

      const result = adapter.toCanonical(input);
      expect(result.content).toEqual([
        ['type', 'test'],
        ['value', '123']
      ]);
    });

    it('should handle nested arrays', () => {
      const input = JSON.stringify({
        items: [
          { id: '1', value: 'a' },
          { id: '2', value: 'b' }
        ]
      });

      const result = adapter.toCanonical(input);
      expect(result.content).toEqual([
        ['items', '1', 'a'],
        ['items', '2', 'b']
      ]);
    });

    it('should throw error for invalid JSON', () => {
      expect(() => adapter.toCanonical('invalid json')).toThrow(BadRequestException);
      expect(() => adapter.toCanonical('{"unclosed": "object"')).toThrow(BadRequestException);
      expect(() => adapter.toCanonical('')).toThrow(BadRequestException);
      expect(() => adapter.toCanonical(null)).toThrow(BadRequestException);
      expect(() => adapter.toCanonical(undefined)).toThrow(BadRequestException);
    });
  });

  describe('fromCanonical', () => {
    it('should convert canonical model to JSON format', () => {
      const canonicalModel = new CanonicalModel({
        metadata: { format: 'JSON' },
        content: [
          ['item', 'example', '123', '1', 'test']
        ],
      });

      const result = adapter.fromCanonical(canonicalModel);
      const parsed = JSON.parse(result);
      expect(parsed).toEqual({
        root: {
          item: [
            {
              item1: 'example',
              item2: '123',
              item3: '1',
              item4: 'test'
            }
          ]
        }
      });
    });

    it('should handle empty content', () => {
      const canonicalModel = new CanonicalModel({
        metadata: { format: 'JSON' },
        content: [],
      });

      const result = adapter.fromCanonical(canonicalModel);
      expect(JSON.parse(result)).toEqual({ root: {} });
    });

    it('should handle multiple items of same type', () => {
      const canonicalModel = new CanonicalModel({
        metadata: { format: 'JSON' },
        content: [
          ['item', '1', 'a'],
          ['item', '2', 'b']
        ],
      });

      const result = adapter.fromCanonical(canonicalModel);
      const parsed = JSON.parse(result);
      expect(parsed).toEqual({
        root: {
          item: [
            { item1: '1', item2: 'a' },
            { item1: '2', item2: 'b' }
          ]
        }
      });
    });

    it('should throw error for invalid canonical model', () => {
      expect(() => adapter.fromCanonical(null)).toThrow(BadRequestException);
      expect(() => adapter.fromCanonical(undefined)).toThrow(BadRequestException);
      expect(() => adapter.fromCanonical({ content: 'invalid' } as any)).toThrow(BadRequestException);
    });
  });
});
