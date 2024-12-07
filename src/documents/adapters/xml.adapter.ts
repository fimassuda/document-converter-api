import { BadRequestException, Injectable } from '@nestjs/common';
import { FormatAdapter } from './format.adapter';
import { CanonicalModel } from '../models/canonical.model';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';

@Injectable()
export class XMLAdapter implements FormatAdapter {
  private readonly parser: XMLParser;
  private readonly builder: XMLBuilder;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseAttributeValue: false,
      parseTagValue: false,
      trimValues: true,
      isArray: (name) => {
        return name === 'item';
      },
      stopNodes: ['*.unclosed'],
    });

    this.builder = new XMLBuilder({
      ignoreAttributes: false,
      format: true,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      suppressEmptyNode: false,
      processEntities: false,
    });
  }

  toCanonical(input: string): CanonicalModel {
    try {
      // Basic XML validation
      if (!input || typeof input !== 'string') {
        throw new BadRequestException('Invalid XML: Input must be a non-empty string');
      }

      const trimmedInput = input.trim();
      if (!trimmedInput.startsWith('<') || !trimmedInput.endsWith('>')) {
        throw new BadRequestException('Invalid XML: Must start with < and end with >');
      }

      // Try to parse XML
      let parsed;
      try {
        parsed = this.parser.parse(input);
      } catch (parseError) {
        throw new BadRequestException(`Invalid XML: ${parseError.message}`);
      }

      // Return empty content for empty root
      if (!parsed.root || Object.keys(parsed.root).length === 0) {
        return new CanonicalModel({
          metadata: { format: 'XML' },
          content: [],
        });
      }

      const result: string[][] = [];
      const processNode = (node: any, parentKey?: string) => {
        if (Array.isArray(node)) {
          node.forEach(item => processNode(item, parentKey));
          return;
        }

        const values: string[] = [];
        const keys = Object.keys(node).filter(k => !k.startsWith('@_') && k !== '#text');
        
        for (const key of keys) {
          const value = node[key];
          if (typeof value === 'object' && value !== null) {
            if (parentKey) {
              const objValues = Object.values(value);
              values.push(...objValues.map(v => String(v)));
            } else {
              processNode(value, key);
            }
          } else if (value !== undefined && value !== null) {
            values.push(String(value));
          }
        }

        if (parentKey && values.length > 0) {
          result.push([parentKey, ...values]);
        }
      };

      processNode(parsed.root);

      return new CanonicalModel({
        metadata: { format: 'XML' },
        content: result,
      });
    } catch (error) {
      throw new BadRequestException(`Error converting document: ${error.message}`);
    }
  }

  fromCanonical(model: CanonicalModel): string {
    try {
      if (!model?.content) {
        throw new BadRequestException('Invalid content: content is required');
      }

      if (!Array.isArray(model.content)) {
        throw new BadRequestException('Invalid content: must be an array');
      }

      // Handle empty content
      if (model.content.length === 0) {
        return '<?xml version="1.0" encoding="UTF-8"?>\n<root></root>';
      }

      const result: any = { root: {} };
      const groupedItems = new Map<string, string[][]>();

      for (const row of model.content) {
        const [type, ...values] = row;

        if (!groupedItems.has(type)) {
          groupedItems.set(type, []);
        }
        groupedItems.get(type)!.push(values);
      }

      for (const [type, items] of groupedItems) {
        if (!result.root[type]) {
          result.root[type] = [];
        }

        for (const item of items) {
          const itemObj: Record<string, string> = {};
          for (let i = 0; i < item.length; i++) {
            itemObj[`${type}${i + 1}`] = item[i];
          }
          result.root[type].push(itemObj);
        }
      }

      const xmlString = this.builder.build(result);
      return '<?xml version="1.0" encoding="UTF-8"?>\n' + xmlString;
    } catch (error) {
      throw new BadRequestException(`Error converting document: ${error.message}`);
    }
  }
}
