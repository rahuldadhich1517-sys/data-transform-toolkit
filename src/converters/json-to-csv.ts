/**
 * JSON to CSV Converter
 */

import type { CsvSerializeOptions } from '../types/csv.js';
import type { JsonValue } from '../types/common.js';
import { serializeCsv } from '../serializers/csv-serializer.js';

export interface JsonToCsvOptions extends CsvSerializeOptions {
  // Additional options can be added here
}

/**
 * Convert JSON array to CSV string
 * @param data Array of objects to convert
 * @param options Conversion options
 * @returns CSV formatted string
 */
export function jsonToCsv(data: JsonValue, options?: JsonToCsvOptions): string {
  return serializeCsv(data, options);
}
