/**
 * CSV to JSON Converter
 */

import type { CsvParseOptions, CsvRecord } from '../types/csv.js';
import { parseCsv } from '../parsers/csv-parser.js';

export interface CsvToJsonOptions extends CsvParseOptions {
  // Additional options can be added here
}

/**
 * Convert CSV string to JSON array
 * @param csv CSV formatted string
 * @param options Conversion options
 * @returns Array of objects
 */
export function csvToJson(csv: string, options?: CsvToJsonOptions): CsvRecord[] {
  return parseCsv(csv, options);
}
