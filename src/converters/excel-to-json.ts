/**
 * Excel (XLSX) to JSON Converter
 */

import readXlsxFile from 'read-excel-file/node';
import { InvalidInputError } from '../errors/index.js';

export interface ExcelToJsonOptions {
  /** Sheet name or 1-based sheet index. Defaults to 1 */
  sheet?: string | number;
  /** Whether the first row contains column headers. Defaults to true */
  hasHeader?: boolean;
  /** Custom column headers to use */
  headers?: string[];
}

/**
 * Convert Excel workbook (XLSX) worksheet into JSON records
 */
export async function excelToJson(
  file: Buffer | Uint8Array,
  options: ExcelToJsonOptions = {}
): Promise<Record<string, unknown>[]> {
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
    return [];
  }

  const hasHeader = options.hasHeader !== false;
  let headers: string[] = [];
  let startIndex = 0;

  if (options.headers && options.headers.length > 0) {
    headers = [...options.headers];
    startIndex = 0;
  } else if (hasHeader && rawRows.length > 0) {
    const firstRow = rawRows[0]!;
    headers = deduplicateHeaders(firstRow.map((c, i) => (c !== null && c !== undefined ? String(c).trim() : `column_${i + 1}`)));
    startIndex = 1;
  } else {
    const maxCols = Math.max(...rawRows.map(r => r.length));
    headers = Array.from({ length: maxCols }, (_, i) => `column_${i + 1}`);
    startIndex = 0;
  }

  const result: Record<string, unknown>[] = [];

  for (let r = startIndex; r < rawRows.length; r++) {
    const row = rawRows[r]!;
    const record: Record<string, unknown> = {};

    for (let c = 0; c < headers.length; c++) {
      const header = headers[c]!;
      const val = row[c];

      if (val === null || val === undefined) {
        record[header] = null;
      } else if (val instanceof Date) {
        record[header] = val.toISOString();
      } else {
        record[header] = val;
      }
    }

    result.push(record);
  }

  return result;
}

function deduplicateHeaders(headers: string[]): string[] {
  const counts: Record<string, number> = {};
  const result: string[] = [];

  for (const h of headers) {
    const base = h || 'column';
    if (!(base in counts)) {
      counts[base] = 1;
      result.push(base);
    } else {
      const count = counts[base]! + 1;
      counts[base] = count;
      result.push(`${base}_${count}`);
    }
  }

  return result;
}
