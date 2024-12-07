import { Injectable, BadRequestException } from '@nestjs/common';
import { SupportedFileType } from '../enums/supported-file-type.enum';
import { StringAdapter } from '../adapters/string.adapter';
import { JSONAdapter } from '../adapters/json.adapter';
import { XMLAdapter } from '../adapters/xml.adapter';
import { FormatAdapter } from '../adapters/format.adapter';

@Injectable()
export class DocumentsService {
  private readonly adapters: Map<SupportedFileType, FormatAdapter>;

  constructor(
    private readonly stringAdapter: StringAdapter,
    private readonly jsonAdapter: JSONAdapter,
    private readonly xmlAdapter: XMLAdapter,
  ) {
    this.adapters = new Map<SupportedFileType, FormatAdapter>(
      [
        [SupportedFileType.STRING, stringAdapter],
        [SupportedFileType.JSON, jsonAdapter],
        [SupportedFileType.XML, xmlAdapter],
      ],
    );
  }

  private getAdapter(format: SupportedFileType): FormatAdapter {
    const adapter = this.adapters.get(format);
    if (!adapter) {
      throw new BadRequestException(`Unsupported format: ${format}`);
    }
    return adapter;
  }

  async convert(params: {
    content: string;
    convertFrom: SupportedFileType;
    convertTo: SupportedFileType;
    lineSeparator?: string;
    elementSeparator?: string;
  }): Promise<string> {
    const { content, convertFrom, convertTo, lineSeparator, elementSeparator } = params;
    const fromAdapter = this.getAdapter(convertFrom);
    const toAdapter = this.getAdapter(convertTo);

    // Set separators for string adapter if needed
    if (convertFrom === SupportedFileType.STRING) {
      (fromAdapter as StringAdapter).setSeparators(lineSeparator!, elementSeparator!);
    }
    if (convertTo === SupportedFileType.STRING) {
      (toAdapter as StringAdapter).setSeparators(lineSeparator!, elementSeparator!);
    }

    // Convert from source format to canonical model
    const canonicalModel = fromAdapter.toCanonical(content);

    // Convert from canonical model to target format
    return toAdapter.fromCanonical(canonicalModel);
  }
}
