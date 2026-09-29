/**
 * Text to CSV Converter
 */

import { parseCsv } from '../parsers/csv-parser.js';
import { serializeCsv } from '../serializers/csv-serializer.js';
import { InvalidInputError } from '../errors/index.js';

export interface TextToCsvOptions {
  /** Input delimiter. If omitted, attempts auto-detection among [',', '\t', ';', '|'] */
  delimiter?: string;
  /** Output CSV delimiter. Defaults to ',' */
  outputDelimiter?: string;
  /** Whether the first row should be treated as header. Defaults to true */
  hasHeader?: boolean;
  /** If true, trim whitespace around cell values. Defaults to true */
  trim?: boolean;
}

/**
 * Convert arbitrary delimited or pasted text into standard CSV
 */
export function textToCsv(
  text: string,
  options: TextToCsvOptions = {}
): string {
  if (typeof text !== 'string') {
    throw new InvalidInputError('Input must be a string');
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return '';
  }

  const inDelimiter = options.delimiter ?? detectDelimiter(text);
  const outDelimiter = options.outputDelimiter ?? ',';
  const hasHeader = options.hasHeader !== false;

  const records = parseCsv(text, {
    delimiter: inDelimiter,
    headers: false,
    trim: options.trim ?? true,
    parseNumbers: false,
    parseBooleans: false
  });

  if (records.length === 0) {
    return '';
  }

  const rawRows: string[][] = records.map(r => Object.values(r).map(v => (v !== null ? String(v) : '')));
  const maxCols = Math.max(...rawRows.map(r => r.length));

  const normalizedRows = rawRows.map(row => {
    const copy = [...row];
    while (copy.length < maxCols) {
      copy.push('');
    }
    return copy;
  });

  const lines = normalizedRows.map(row => {
    return row.map(val => {
      const needsQuotes = val.includes(outDelimiter) || val.includes('"') || val.includes('\n') || val.includes('\r');
      if (needsQuotes) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    }).join(outDelimiter);
  });

  return lines.join('\n');
}

function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/)[0] || '';
  const candidates = [',', '\t', ';', '|'];
  let bestDelim = ',';
  let maxCount = 0;

  for (const delim of candidates) {
    const count = (firstLine.match(new RegExp(`\\${delim}`, 'g')) || []).length;
    if (count > maxCount) {
      maxCount = count;
      bestDelim = delim;
    }
  }

  return bestDelim;
}
