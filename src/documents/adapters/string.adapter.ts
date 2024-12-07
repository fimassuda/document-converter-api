import { BadRequestException, Injectable } from '@nestjs/common';
import { CanonicalModel } from '../models/canonical.model';
import { FormatAdapter } from './format.adapter';

@Injectable()
export class StringAdapter implements FormatAdapter {
  private lineSeparator: string;
  private elementSeparator: string;

  constructor() {
    this.lineSeparator = '';
    this.elementSeparator = '';
  }

  toCanonical(input: string): CanonicalModel {
    if (!this.lineSeparator || !this.elementSeparator) {
      throw new BadRequestException('Both line separator and element separator must be provided');
    }

    if (!input) {
      return new CanonicalModel({
        metadata: {
          format: 'STRING',
          lineSeparator: this.lineSeparator,
          elementSeparator: this.elementSeparator,
        },
        content: [],
      });
    }

    const lines = input.split(this.lineSeparator);
    const result: string[][] = [];

    for (const line of lines) {
      const elements = line.split(this.elementSeparator).map(el => el.trim());
      if (elements.some(el => el !== '')) {
        result.push(elements);
      }
    }

    return new CanonicalModel({
      metadata: {
        format: 'STRING',
        lineSeparator: this.lineSeparator,
        elementSeparator: this.elementSeparator,
      },
      content: result,
    });
  }

  fromCanonical(model: CanonicalModel): string {
    if (!this.lineSeparator || !this.elementSeparator) {
      throw new BadRequestException('Both line separator and element separator must be provided');
    }

    if (!model?.content) {
      throw new BadRequestException('Invalid content: content is required');
    }

    try {
      if (!Array.isArray(model.content)) {
        throw new Error('Invalid content: must be an array');
      }

      const lines = model.content.map(row => {
        return row.map(item => item?.trim()).join(this.elementSeparator);
      });

      return lines.join(this.lineSeparator);
    } catch (error) {
      throw new BadRequestException(`Failed to convert to string: ${error.message}`);
    }
  }

  setSeparators(lineSeparator: string, elementSeparator: string): void {
    if (!lineSeparator || !elementSeparator) {
      throw new BadRequestException('Both line separator and element separator must be provided');
    }
    if (lineSeparator === elementSeparator) {
      throw new BadRequestException('Line separator and element separator must be different');
    }
    this.lineSeparator = lineSeparator;
    this.elementSeparator = elementSeparator;
  }
}
