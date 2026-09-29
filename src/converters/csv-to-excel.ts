/**
 * CSV to Excel (XLSX) Converter
 */

import writeXlsxFile, { type SheetData, type Row, type Cell } from 'write-excel-file/node';
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

  const sheetData: SheetData = [];
  const hasHeader = options.hasHeader !== false;

  for (let rowIndex = 0; rowIndex < records.length; rowIndex++) {
    const record = records[rowIndex]!;
    const rowCells: Cell[] = [];
    const isHeaderRow = rowIndex === 0 && hasHeader;

    // Keys are column_0, column_1, ...
    const colKeys = Object.keys(record);
    for (const key of colKeys) {
      const val = record[key];

      if (val === null || val === undefined || val === '') {
        rowCells.push({ value: undefined });
      } else if (isHeaderRow) {
        rowCells.push({
          value: String(val),
          fontWeight: 'bold'
        });
      } else {
        // Auto-detect number
        const trimmed = String(val).trim();
        if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
          const num = Number(trimmed);
          if (!isNaN(num)) {
            rowCells.push({ value: num, type: Number });
            continue;
          }
        }
        if (trimmed.toLowerCase() === 'true') {
          rowCells.push({ value: true, type: Boolean });
          continue;
        }
        if (trimmed.toLowerCase() === 'false') {
          rowCells.push({ value: false, type: Boolean });
          continue;
        }

        rowCells.push({ value: String(val), type: String });
      }
    }

    sheetData.push(rowCells as Row);
  }

  const output = writeXlsxFile(sheetData, {
    sheet: options.sheetName ?? 'Sheet1'
  });

  return await output.toBuffer();
}
