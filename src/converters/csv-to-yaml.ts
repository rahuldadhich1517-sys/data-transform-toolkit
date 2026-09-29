/**
 * CSV to YAML Converter
 */

import { parseCsv } from '../parsers/csv-parser.js';
import { serializeYaml } from '../serializers/yaml-serializer.js';
import type { YamlSerializeOptions } from '../types/yaml.js';
import type { CsvParseOptions } from '../types/csv.js';
import { InvalidInputError } from '../errors/index.js';

export interface CsvToYamlOptions extends YamlSerializeOptions {
  /** CSV parse delimiter. Defaults to ',' */
  delimiter?: string;
  /** Whether CSV has a header row. Defaults to true */
  hasHeader?: boolean;
}

/**
 * Convert CSV text into a YAML string
 */
export function csvToYaml(
  csv: string,
  options: CsvToYamlOptions = {}
): string {
  if (typeof csv !== 'string') {
    throw new InvalidInputError('Input must be a string');
  }

  const trimmed = csv.trim();
  if (!trimmed) {
    return '[]\n';
  }

  const records = parseCsv(csv, {
    delimiter: options.delimiter ?? ',',
    headers: options.hasHeader !== false,
    parseNumbers: false,
    parseBooleans: false
  });

  const parsedRecords = records.map(rec => {
    const obj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rec)) {
      if (v !== null && /^-?\d+(\.\d+)?$/.test(v)) {
        obj[k] = Number(v);
      } else if (v === 'true') {
        obj[k] = true;
      } else if (v === 'false') {
        obj[k] = false;
      } else {
        obj[k] = v;
      }
    }
    return obj;
  });

  return serializeYaml(parsedRecords as unknown as import('../types/common.js').JsonValue, options);
}
