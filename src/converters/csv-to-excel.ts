/**
 * CSV to Excel (XLSX) Converter
 */

import { buildXlsx } from '../internal/xlsx.js';
import { parseCsv } from '../parsers/csv-parser.js';
import type { CsvParseOptions } from '../types/csv.js';
import { InvalidInputError } from '../errors/index.js';

export interface CsvToExcelOptions extends CsvParseOptions {
  /** Name of the sheet. Defaults to 'Sheet1' */
  sheetName?: string;
  /** Whether the first row should be styled/treated as a header row. Defaults to true */
  hasHeader?: boolean;
}

/**
 * Convert CSV string into an Excel (XLSX) workbook Buffer
 */
export async function csvToExcel(
  csv: string,
  options: CsvToExcelOptions = {}
): Promise<Buffer> {
  if (typeof csv !== 'string') {
    throw new InvalidInputError('Input must be a string');
  }

  // Parse CSV records
  const records = parseCsv(csv, {
    delimiter: options.delimiter ?? ',',
    trim: options.trim ?? false,
    parseNumbers: false,
    parseBooleans: false,
    headers: false // Parse as raw positional fields first
  });

  const sheetRows: Array<Array<unknown>> = [];
  const hasHeader = options.hasHeader !== false;

  for (let rowIndex = 0; rowIndex < records.length; rowIndex++) {
    const record = records[rowIndex]!;
    const rowCells: unknown[] = [];
    const isHeaderRow = rowIndex === 0 && hasHeader;

    // Keys are column_0, column_1, ...
    const colKeys = Object.keys(record);
    for (const key of colKeys) {
      const val = record[key];

      if (val === null || val === undefined || val === '') {
        rowCells.push(null);
      } else if (isHeaderRow) {
        rowCells.push(String(val));
      } else {
        // Auto-detect number
        const trimmed = String(val).trim();
        if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
          const num = Number(trimmed);
          if (!isNaN(num)) {
            rowCells.push(num);
            continue;
          }
        }
        if (trimmed.toLowerCase() === 'true') {
          rowCells.push(true);
          continue;
        }
        if (trimmed.toLowerCase() === 'false') {
          rowCells.push(false);
          continue;
        }

        rowCells.push(String(val));
      }
    }

    sheetRows.push(rowCells);
  }

  const sheetName = options.sheetName ?? 'Sheet1';
  return buildXlsx([{ name: sheetName, rows: sheetRows }]);
}
