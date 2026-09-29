/**
 * Excel (XLSX) to CSV Converter
 */

import readXlsxFile from 'read-excel-file/node';
import { serializeCsv } from '../serializers/csv-serializer.js';
import { InvalidInputError } from '../errors/index.js';

export interface ExcelToCsvOptions {
  /** Sheet name or 1-based sheet index. Defaults to 1 */
  sheet?: string | number;
  /** Delimiter to use in CSV. Defaults to ',' */
  delimiter?: string;
  /** Line ending in CSV. Defaults to '\n' */
  lineEnding?: string;
}

/**
 * Convert Excel workbook (XLSX) into CSV string
 */
export async function excelToCsv(
  file: Buffer | Uint8Array,
  options: ExcelToCsvOptions = {}
): Promise<string> {
  if (!file || (!(file instanceof Uint8Array) && !Buffer.isBuffer(file))) {
    throw new InvalidInputError('Input must be a Buffer or Uint8Array');
  }

  const readOptions: { sheet?: string | number } = {};
  if (options.sheet !== undefined) {
    readOptions.sheet = options.sheet;
  }

  const buffer = Buffer.isBuffer(file) ? file : Buffer.from(file);
  const sheets = await (readXlsxFile as (b: Buffer, opts?: unknown) => Promise<unknown>)(buffer, readOptions) as unknown as Array<{ sheet: string; data: unknown[][] }> | unknown[][];

  let rawRows: unknown[][] = [];

  if (Array.isArray(sheets) && sheets.length > 0) {
    const first = sheets[0];
    if (first && typeof first === 'object' && 'data' in first && Array.isArray((first as { data: unknown[][] }).data)) {
      // Find matching sheet if specified by name or index
      if (typeof options.sheet === 'string') {
        const found = (sheets as Array<{ sheet: string; data: unknown[][] }>).find(s => s.sheet === options.sheet);
        if (!found) {
          throw new InvalidInputError(`Sheet "${options.sheet}" not found in workbook`);
        }
        rawRows = found.data;
      } else if (typeof options.sheet === 'number') {
        const idx = options.sheet - 1;
        const targetSheet = (sheets as Array<{ sheet: string; data: unknown[][] }>)[idx];
        if (!targetSheet) {
          throw new InvalidInputError(`Sheet index ${options.sheet} out of range`);
        }
        rawRows = targetSheet.data;
      } else {
        rawRows = (sheets as Array<{ sheet: string; data: unknown[][] }>)[0]!.data;
      }
    } else {
      rawRows = sheets as unknown[][];
    }
  }

  if (rawRows.length === 0) {
    return '';
  }

  const delimiter = options.delimiter ?? ',';
  const lineEnding = options.lineEnding ?? '\n';

  // Format rows into CSV lines
  const lines = rawRows.map(row => {
    return row.map(cell => {
      if (cell === null || cell === undefined) {
        return '';
      }
      let str = String(cell);
      if (cell instanceof Date) {
        str = cell.toISOString();
      }
      const needsQuotes = str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r');
      if (needsQuotes) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(delimiter);
  });

  return lines.join(lineEnding);
}
