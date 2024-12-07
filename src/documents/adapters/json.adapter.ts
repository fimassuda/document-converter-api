import { Injectable, BadRequestException } from '@nestjs/common';
import { FormatAdapter } from './format.adapter';
import { CanonicalModel } from '../models/canonical.model';

@Injectable()
export class JSONAdapter implements FormatAdapter {
  toCanonical(input: string): CanonicalModel {
    try {
      const parsed = JSON.parse(input);

      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid JSON: must be an object');
      }

      const result: string[][] = [];
      const processObject = (obj: any, parentKey?: string) => {
        for (const [key, value] of Object.entries(obj)) {
          if (key === 'root') {
            processObject(value);
            continue;
          }

          if (Array.isArray(value)) {
            value.forEach(item => {
              if (typeof item === 'object' && item !== null) {
                const row = [key];
                const flattenedValues = flattenObject(item);
                Object.values(flattenedValues).forEach(v => row.push(String(v)));
                result.push(row);
              }
            });
          } else {
            result.push([key, String(value)]);
          }
        }
      };

      const flattenObject = (obj: any): Record<string, any> => {
        const result: Record<string, any> = {};
        
        const flatten = (obj: any, prefix = '') => {
          Object.entries(obj)
            .sort(([a], [b]) => a.localeCompare(b))
            .forEach(([key, value]) => {
              const newPrefix = prefix ? `${prefix}.${key}` : key;
              if (typeof value === 'object' && value !== null) {
                flatten(value, newPrefix);
              } else {
                result[newPrefix] = value;
              }
            });
        };

        flatten(obj);
        return result;
      };

      processObject(parsed);

      return new CanonicalModel({
        metadata: { format: 'JSON' },
        content: result,
      });
    } catch (error) {
      throw new BadRequestException(`Failed to parse JSON: ${error.message}`);
    }
  }

  fromCanonical(model: CanonicalModel): string {
    try {
      if (!model?.content || !Array.isArray(model.content)) {
        throw new Error('Invalid canonical model: content must be an array');
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

      return JSON.stringify(result, null, 2);
    } catch (error) {
      throw new BadRequestException(`Failed to convert to JSON: ${error.message}`);
    }
  }
}
