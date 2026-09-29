/**
 * HTML Table to JSON Converter
 * Extracts table data into JSON objects without browser DOM dependencies.
 */

import { tokenizeHtml, type HtmlToken } from '../internal/html-parser.js';
import { unescapeHtml } from '../internal/escaping.js';
import { InvalidInputError } from '../errors/index.js';

export interface HtmlTableToJsonOptions {
  /** If true, return an array of table results even if only one table is present */
  multipleTables?: boolean;
  /** Whether the first row should be treated as header if no <thead> exists. Defaults to true */
  hasHeader?: boolean;
}

/**
 * Extract HTML table(s) into JSON array(s) of row objects
 */
export function htmlTableToJson(
  html: string,
  options: HtmlTableToJsonOptions = {}
): Record<string, string>[] | Record<string, string>[][] {
  if (typeof html !== 'string') {
    throw new InvalidInputError('Input must be a string');
  }

  const tokens = tokenizeHtml(html);
  const tables: Record<string, string>[][] = [];

  let inTable = false;
  let inRow = false;
  let inCell = false;
  let isHeaderCell = false;
  let cellText = '';
  let cellColspan = 1;

  let currentTableRows: { isHeader: boolean; cells: { text: string; colspan: number }[] }[] = [];
  let currentRow: { isHeader: boolean; cells: { text: string; colspan: number }[] } = {
    isHeader: false,
    cells: []
  };

  for (const token of tokens) {
    if (token.type === 'tag_open') {
      const tag = token.name;
      if (tag === 'table') {
        inTable = true;
        currentTableRows = [];
      } else if (tag === 'tr' && inTable) {
        inRow = true;
        currentRow = { isHeader: false, cells: [] };
      } else if ((tag === 'td' || tag === 'th') && inRow) {
        inCell = true;
        isHeaderCell = tag === 'th';
        cellText = '';
        cellColspan = 1;
        if (token.attrs?.colspan) {
          const parsed = parseInt(token.attrs.colspan, 10);
          if (!isNaN(parsed) && parsed > 1) {
            cellColspan = parsed;
          }
        }
      }
    } else if (token.type === 'tag_close') {
      const tag = token.name;
      if ((tag === 'td' || tag === 'th') && inCell) {
        inCell = false;
        currentRow.cells.push({ text: unescapeHtml(cellText).trim(), colspan: cellColspan });
        if (isHeaderCell) {
          currentRow.isHeader = true;
        }
      } else if (tag === 'tr' && inRow) {
        inRow = false;
        if (currentRow.cells.length > 0) {
          currentTableRows.push(currentRow);
        }
      } else if (tag === 'table' && inTable) {
        inTable = false;
        const parsedTable = processTableRows(currentTableRows, options.hasHeader !== false);
        tables.push(parsedTable);
      }
    } else if (token.type === 'text' && inCell) {
      cellText += token.content;
    }
  }

  if (options.multipleTables) {
    return tables;
  }

  return tables.length > 0 ? tables[0]! : [];
}

function processTableRows(
  rows: { isHeader: boolean; cells: { text: string; colspan: number }[] }[],
  hasHeader: boolean
): Record<string, string>[] {
  if (rows.length === 0) {
    return [];
  }

  // Expand colspans in cells
  const expandedRows: string[][] = rows.map(r => {
    const rowVals: string[] = [];
    for (const cell of r.cells) {
      for (let s = 0; s < cell.colspan; s++) {
        rowVals.push(cell.text);
      }
    }
    return rowVals;
  });

  const maxCols = Math.max(...expandedRows.map(r => r.length));
  if (maxCols === 0) {
    return [];
  }

  let headers: string[] = [];
  let dataRows: string[][] = [];

  const firstIsHeader = rows[0]!.isHeader || hasHeader;

  if (firstIsHeader && expandedRows.length > 0) {
    const rawHeaders = expandedRows[0]!;
    headers = deduplicateHeaders(
      Array.from({ length: maxCols }, (_, i) => rawHeaders[i]?.trim() || `column_${i + 1}`)
    );
    dataRows = expandedRows.slice(1);
  } else {
    headers = Array.from({ length: maxCols }, (_, i) => `column_${i + 1}`);
    dataRows = expandedRows;
  }

  const result: Record<string, string>[] = [];

  for (const row of dataRows) {
    const record: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      const header = headers[c]!;
      record[header] = row[c] ?? '';
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
