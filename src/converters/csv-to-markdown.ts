/**
 * CSV to Markdown Table Converter
 */

import { parseCsv } from '../parsers/csv-parser.js';
import { InvalidInputError } from '../errors/index.js';

export type ColumnAlignment = 'left' | 'center' | 'right' | 'default';

export interface CsvToMarkdownOptions {
  /** If true, the first row is treated as table headers. Defaults to true */
  hasHeader?: boolean;
  /** Alignment for columns: 'left', 'center', 'right', or array per column */
  alignment?: ColumnAlignment | ColumnAlignment[];
  /** Delimiter used in the CSV. Defaults to ',' */
  delimiter?: string;
}

/**
 * Convert CSV text into a Markdown table string
 */
export function csvToMarkdown(
  csv: string,
  options: CsvToMarkdownOptions = {}
): string {
  if (typeof csv !== 'string') {
    throw new InvalidInputError('Input must be a string');
  }

  const trimmed = csv.trim();
  if (!trimmed) {
    return '';
  }

  const delimiter = options.delimiter ?? ',';
  const hasHeader = options.hasHeader !== false;

  const records = parseCsv(csv, {
    delimiter,
    headers: false,
    parseNumbers: false,
    parseBooleans: false
  });

  if (records.length === 0) {
    return '';
  }

  const rawRows: string[][] = records.map(r =>
    Object.values(r).map(v => (v !== null ? String(v) : ''))
  );

  // Normalize column count across all rows
  const maxCols = Math.max(...rawRows.map(r => r.length));
  if (maxCols === 0) {
    return '';
  }

  const normalizedRows = rawRows.map(row => {
    const copy = [...row];
    while (copy.length < maxCols) {
      copy.push('');
    }
    return copy.map(cell => formatMarkdownCell(cell));
  });

  let headers: string[];
  let dataRows: string[][];

  if (hasHeader) {
    headers = normalizedRows[0]!;
    dataRows = normalizedRows.slice(1);
  } else {
    headers = Array.from({ length: maxCols }, (_, i) => `column_${i + 1}`);
    dataRows = normalizedRows;
  }

  // Calculate column widths
  const colWidths = Array.from({ length: maxCols }, (_, i) => {
    let max = Math.max(3, headers[i]?.length ?? 3);
    for (const row of dataRows) {
      if (row[i] && row[i]!.length > max) {
        max = row[i]!.length;
      }
    }
    return max;
  });

  // Alignment delimiter line
  const delimiterParts = colWidths.map((width, i) => {
    const align = getColAlignment(options.alignment, i);
    if (align === 'center') {
      return `:${'-'.repeat(Math.max(1, width - 2))}:`;
    } else if (align === 'right') {
      return `${'-'.repeat(Math.max(2, width - 1))}:`;
    } else if (align === 'left') {
      return `:${'-'.repeat(Math.max(2, width - 1))}`;
    }
    return '-'.repeat(Math.max(3, width));
  });

  const lines: string[] = [];

  // Header row
  const headerLine = `| ${headers.map((h, i) => h.padEnd(colWidths[i]!)).join(' | ')} |`;
  lines.push(headerLine);

  // Separator row
  const sepLine = `| ${delimiterParts.map((d, i) => d.padEnd(colWidths[i]!)).join(' | ')} |`;
  lines.push(sepLine);

  // Data rows
  for (const row of dataRows) {
    const rowLine = `| ${row.map((cell, i) => cell.padEnd(colWidths[i]!)).join(' | ')} |`;
    lines.push(rowLine);
  }

  return lines.join('\n');
}

function formatMarkdownCell(val: string): string {
  return val
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, '<br>');
}

function getColAlignment(
  alignment: ColumnAlignment | ColumnAlignment[] | undefined,
  index: number
): ColumnAlignment {
  if (!alignment) return 'default';
  if (Array.isArray(alignment)) {
    return alignment[index] ?? 'default';
  }
  return alignment;
}
