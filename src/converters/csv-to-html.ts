/**
 * CSV to HTML Table Converter
 */

import { parseCsv } from '../parsers/csv-parser.js';
import { escapeHtml } from '../internal/escaping.js';
import { InvalidInputError } from '../errors/index.js';

export interface CsvToHtmlOptions {
  /** If true, the first row is treated as <thead> headers. Defaults to true */
  hasHeader?: boolean;
  /** CSS class to apply to <table> element */
  tableClass?: string;
  /** Custom HTML attributes for the <table> tag (keys and values are safely escaped) */
  attributes?: Record<string, string>;
  /** Delimiter used in the CSV. Defaults to ',' */
  delimiter?: string;
}

/**
 * Convert CSV text into an HTML <table> string
 */
export function csvToHtml(
  csv: string,
  options: CsvToHtmlOptions = {}
): string {
  if (typeof csv !== 'string') {
    throw new InvalidInputError('Input must be a string');
  }

  const trimmed = csv.trim();
  if (!trimmed) {
    return '<table>\n  <tbody>\n  </tbody>\n</table>';
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
    return '<table>\n  <tbody>\n  </tbody>\n</table>';
  }

  // Construct table tag with optional class and attributes
  const attrParts: string[] = [];
  if (options.tableClass) {
    attrParts.push(`class="${escapeHtml(options.tableClass)}"`);
  }
  if (options.attributes) {
    for (const [key, val] of Object.entries(options.attributes)) {
      if (/^[a-zA-Z0-9_\-]+$/.test(key)) {
        attrParts.push(`${key}="${escapeHtml(val)}"`);
      }
    }
  }

  const openTable = attrParts.length > 0 ? `<table ${attrParts.join(' ')}>` : '<table>';
  const rows: string[][] = records.map(r => Object.values(r).map(v => (v !== null ? String(v) : '')));

  const parts: string[] = [openTable];

  let dataRows = rows;
  if (hasHeader && rows.length > 0) {
    const headerRow = rows[0]!;
    dataRows = rows.slice(1);

    parts.push('  <thead>');
    parts.push('    <tr>');
    for (const cell of headerRow) {
      parts.push(`      <th>${escapeHtml(cell)}</th>`);
    }
    parts.push('    </tr>');
    parts.push('  </thead>');
  }

  parts.push('  <tbody>');
  for (const row of dataRows) {
    parts.push('    <tr>');
    for (const cell of row) {
      parts.push(`      <td>${escapeHtml(cell)}</td>`);
    }
    parts.push('    </tr>');
  }
  parts.push('  </tbody>');
  parts.push('</table>');

  return parts.join('\n');
}
