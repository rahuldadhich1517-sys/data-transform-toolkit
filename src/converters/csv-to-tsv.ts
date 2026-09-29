/**
 * CSV <-> TSV Converter
 */

import { parseCsv } from '../parsers/csv-parser.js';
import { InvalidInputError } from '../errors/index.js';

export interface CsvToTsvOptions {
  /** Delimiter in the source input. Defaults to ',' for csvToTsv, '\t' for tsvToCsv */
  sourceDelimiter?: string;
  /** Delimiter in the target output. Defaults to '\t' for csvToTsv, ',' for tsvToCsv */
  targetDelimiter?: string;
  /** Line ending in output. Defaults to '\n' */
  lineEnding?: string;
}

/**
 * Convert CSV formatted text into TSV formatted text
 */
export function csvToTsv(
  csv: string,
  options: CsvToTsvOptions = {}
): string {
  if (typeof csv !== 'string') {
    throw new InvalidInputError('Input must be a string');
  }

  const sourceDelimiter = options.sourceDelimiter ?? ',';
  const targetDelimiter = options.targetDelimiter ?? '\t';
  const lineEnding = options.lineEnding ?? '\n';

  return convertDelimited(csv, sourceDelimiter, targetDelimiter, lineEnding);
}

/**
 * Convert TSV formatted text into CSV formatted text
 */
export function tsvToCsv(
  tsv: string,
  options: CsvToTsvOptions = {}
): string {
  if (typeof tsv !== 'string') {
    throw new InvalidInputError('Input must be a string');
  }

  const sourceDelimiter = options.sourceDelimiter ?? '\t';
  const targetDelimiter = options.targetDelimiter ?? ',';
  const lineEnding = options.lineEnding ?? '\n';

  return convertDelimited(tsv, sourceDelimiter, targetDelimiter, lineEnding);
}

function convertDelimited(
  input: string,
  fromDelim: string,
  toDelim: string,
  lineEnding: string
): string {
  if (!input.trim()) {
    return '';
  }

  const records = parseCsv(input, {
    delimiter: fromDelim,
    headers: false,
    parseNumbers: false,
    parseBooleans: false
  });

  const lines = records.map(record => {
    return Object.values(record).map(val => {
      if (val === null || val === undefined) {
        return '';
      }
      const str = String(val);
      const needsQuotes = str.includes(toDelim) || str.includes('"') || str.includes('\n') || str.includes('\r');
      if (needsQuotes) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(toDelim);
  });

  return lines.join(lineEnding);
}
