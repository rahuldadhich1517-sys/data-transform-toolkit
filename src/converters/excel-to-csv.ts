/**
 * Excel (XLSX) to CSV Converter
 */

import { parseXlsx } from '../internal/xlsx.js';
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

  const buffer = Buffer.isBuffer(file) ? file : Buffer.from(file);
  let sheets: Array<{ sheet: string; data: Array<Array<unknown>> }>;
  try {
    sheets = parseXlsx(buffer);
  } catch (err: unknown) {
    throw new InvalidInputError(`Failed to parse Excel workbook: ${(err as Error).message}`);
  }

  let rawRows: unknown[][] = [];

  if (sheets.length > 0) {
    if (typeof options.sheet === 'string') {
      const found = sheets.find(s => s.sheet === options.sheet);
      if (!found) {
        throw new InvalidInputError(`Sheet "${options.sheet}" not found in workbook`);
      }
      rawRows = found.data;
    } else if (typeof options.sheet === 'number') {
      const idx = options.sheet - 1;
      const targetSheet = sheets[idx];
      if (!targetSheet) {
        throw new InvalidInputError(`Sheet index ${options.sheet} out of range`);
      }
      rawRows = targetSheet.data;
    } else {
      rawRows = sheets[0]!.data;
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
