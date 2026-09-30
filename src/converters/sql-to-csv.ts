/**
 * SQL INSERT Statement to CSV Converter
 * Safely parses INSERT statements into CSV rows without executing SQL.
 */

import { parseSqlInsert } from '../internal/sql-parser.js';
import { serializeCsv } from '../serializers/csv-serializer.js';
import { InvalidInputError } from '../errors/index.js';

export interface SqlToCsvOptions {
  /** Delimiter to use in CSV. Defaults to ',' */
  delimiter?: string;
  /** Whether to include column headers in CSV output. Defaults to true */
  hasHeader?: boolean;
}

/**
 * Convert SQL INSERT statement into a CSV string
 */
export function sqlToCsv(
  sql: string,
  options: SqlToCsvOptions = {}
): string {
  if (typeof sql !== 'string') {
    throw new InvalidInputError('Input must be a string');
  }

  const trimmed = sql.trim();
  if (!trimmed) {
    return '';
  }

  const parsed = parseSqlInsert(sql);
  const delimiter = options.delimiter ?? ',';
  const hasHeader = options.hasHeader !== false;

  if (parsed.rows.length === 0) {
    return hasHeader ? parsed.columns.join(delimiter) : '';
  }

  return serializeCsv(parsed.records, { delimiter, headers: hasHeader });
}
