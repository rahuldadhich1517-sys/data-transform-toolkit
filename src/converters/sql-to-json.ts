/**
 * SQL INSERT Statement to JSON Converter
 * Safely parses SQL INSERT statements into JSON records without executing SQL.
 */

import { parseSqlInsert } from '../internal/sql-parser.js';
import { InvalidInputError } from '../errors/index.js';

export interface SqlToJsonOptions {
  /** Enforce strict SQL syntax parsing */
  strict?: boolean;
}

/**
 * Convert SQL INSERT statement text into an array of JSON record objects
 */
export function sqlToJson(
  sql: string,
  options: SqlToJsonOptions = {}
): Record<string, string | number | boolean | null>[] {
  if (typeof sql !== 'string') {
    throw new InvalidInputError('Input must be a string');
  }

  const trimmed = sql.trim();
  if (!trimmed) {
    return [];
  }

  const parsed = parseSqlInsert(sql, { strict: options.strict });
  return parsed.records;
}
