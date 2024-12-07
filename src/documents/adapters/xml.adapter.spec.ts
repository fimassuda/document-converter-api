import { XMLAdapter } from './xml.adapter';
import { CanonicalModel } from '../models/canonical.model';
import { BadRequestException } from '@nestjs/common';

describe('XMLAdapter', () => {
  let adapter: XMLAdapter;

  beforeEach(() => {
    adapter = new XMLAdapter();
  });

  describe('toCanonical', () => {
    it('should convert XML content to canonical model', () => {
      const xml = `
        <?xml version="1.0" encoding="UTF-8"?>
        <root>
          <item>
            <id>1</id>
            <name>test</name>
            <details>
              <type>example</type>
              <value>123</value>
            </details>
          </item>
        </root>
      `;

      const result = adapter.toCanonical(xml);

      expect(result).toBeInstanceOf(CanonicalModel);
      expect(result.metadata.format).toBe('XML');
      expect(result.content).toEqual([
        ['item', '1', 'test', 'example', '123']
      ]);
    });

    it('should handle empty XML', () => {
      const result = adapter.toCanonical('<root></root>');
      expect(result.metadata.format).toBe('XML');
      expect(result.content).toEqual([]);
    });

    it('should handle simple XML', () => {
      const xml = `
        <root>
          <item>
            <type>test</type>
            <value>123</value>
          </item>
        </root>
      `;
      const result = adapter.toCanonical(xml);
      expect(result.content).toEqual([
        ['item', 'test', '123']
      ]);
    });

    it('should handle multiple items', () => {
      const xml = `
        <root>
          <item>
            <id>1</id>
            <value>a</value>
          </item>
          <item>
            <id>2</id>
            <value>b</value>
          </item>
        </root>
      `;
      const result = adapter.toCanonical(xml);
      expect(result.content).toEqual([
        ['item', '1', 'a'],
        ['item', '2', 'b']
      ]);
    });

    it('should throw error for invalid XML', () => {
      expect(() => adapter.toCanonical('')).toThrow(BadRequestException);
      expect(() => adapter.toCanonical('not xml')).toThrow(BadRequestException);
      expect(() => adapter.toCanonical('<unclosed>')).toThrow(BadRequestException);
    });
  });

  describe('fromCanonical', () => {
    it('should convert canonical model to XML format', () => {
      const canonicalModel = new CanonicalModel({
        metadata: { format: 'XML' },
        content: [
          ['item', 'example', '123', '1', 'test']
        ],
      });

      const result = adapter.fromCanonical(canonicalModel);
      expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result).toContain('<root>');
      expect(result).toContain('<item>');
      expect(result).toContain('<item1>example</item1>');
      expect(result).toContain('<item2>123</item2>');
      expect(result).toContain('<item3>1</item3>');
      expect(result).toContain('<item4>test</item4>');
      expect(result).toContain('</item>');
      expect(result).toContain('</root>');
    });

    it('should handle empty content', () => {
      const canonicalModel = new CanonicalModel({
        metadata: { format: 'XML' },
        content: [],
      });

      const result = adapter.fromCanonical(canonicalModel);
      expect(result).toBe('<?xml version="1.0" encoding="UTF-8"?>\n<root></root>');
    });

    it('should handle multiple items', () => {
      const canonicalModel = new CanonicalModel({
        metadata: { format: 'XML' },
        content: [
          ['item', '1', 'a'],
          ['item', '2', 'b']
        ],
      });

      const result = adapter.fromCanonical(canonicalModel);
      expect(result).toContain('<item1>1</item1>');
      expect(result).toContain('<item2>a</item2>');
      expect(result).toContain('<item1>2</item1>');
      expect(result).toContain('<item2>b</item2>');
    });

    it('should throw error for invalid content', () => {
      expect(() => adapter.fromCanonical(null)).toThrow(BadRequestException);
      expect(() => adapter.fromCanonical(undefined)).toThrow(BadRequestException);
      expect(() => adapter.fromCanonical({ content: 'invalid' } as any)).toThrow(BadRequestException);
      expect(() => adapter.fromCanonical(new CanonicalModel({ content: null }))).toThrow(BadRequestException);
    });
  });
});
