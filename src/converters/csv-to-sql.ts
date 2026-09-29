/**
 * CSV to SQL INSERT Statement Generator
 * Generates SQL text safely. NEVER executes SQL.
 */

import { parseCsv } from '../parsers/csv-parser.js';
import { escapeSqlString, quoteSqlIdentifier, type SqlDialect } from '../internal/escaping.js';
import { InvalidInputError } from '../errors/index.js';

export interface CsvToSqlOptions {
  /** Target SQL table name. Defaults to 'records' */
  tableName?: string;
  /** Explicit column names to use. If not specified, inferred from CSV header row */
  columns?: string[];
  /** Target SQL dialect: 'standard' (default), 'postgres', 'mysql', 'sqlite' */
  dialect?: SqlDialect;
  /** Delimiter used in the CSV. Defaults to ',' */
  delimiter?: string;
  /** Batch size per INSERT statement. Defaults to 0 (all rows in a single statement) */
  batchSize?: number;
  /** If false, treat first row as data. Defaults to true */
  hasHeader?: boolean;
}

/**
 * Convert CSV text into SQL INSERT statement(s)
 */
export function csvToSql(
  csv: string,
  options: CsvToSqlOptions = {}
): string {
  if (typeof csv !== 'string') {
    throw new InvalidInputError('Input must be a string');
  }

  const trimmed = csv.trim();
  if (!trimmed) {
    return '';
  }

  const tableName = options.tableName ?? 'records';
  const dialect = options.dialect ?? 'standard';
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

  const rawRows: (string | null)[][] = records.map(r => Object.values(r));

  let columns: string[];
  let dataRows: (string | null)[][];

  if (options.columns && options.columns.length > 0) {
    columns = options.columns;
    dataRows = hasHeader ? rawRows.slice(1) : rawRows;
  } else if (hasHeader && rawRows.length > 0) {
    columns = rawRows[0]!.map((c, i) => (c ? String(c).trim() : `column_${i + 1}`));
    dataRows = rawRows.slice(1);
  } else {
    const maxCols = Math.max(...rawRows.map(r => r.length));
    columns = Array.from({ length: maxCols }, (_, i) => `column_${i + 1}`);
    dataRows = rawRows;
  }

  if (dataRows.length === 0) {
    return '';
  }

  const quotedTable = quoteSqlIdentifier(tableName, dialect);
  const quotedColumns = columns.map(c => quoteSqlIdentifier(c, dialect)).join(', ');

  const batchSize = options.batchSize && options.batchSize > 0 ? options.batchSize : dataRows.length;
  const statements: string[] = [];

  for (let b = 0; b < dataRows.length; b += batchSize) {
    const batch = dataRows.slice(b, b + batchSize);
    const valueTuples = batch.map(row => {
      const vals = columns.map((_, i) => {
        const cell = row[i];
        return formatSqlValue(cell);
      });
      return `(${vals.join(', ')})`;
    });

    const stmt = `INSERT INTO ${quotedTable} (${quotedColumns}) VALUES\n${valueTuples.join(',\n')};`;
    statements.push(stmt);
  }

  return statements.join('\n\n');
}

function formatSqlValue(val: string | null | undefined): string {
  if (val === null || val === undefined || val === '' || val.toLowerCase() === 'null') {
    return 'NULL';
  }

  const trimmed = val.trim();

  // Boolean check
  if (trimmed.toLowerCase() === 'true') {
    return 'TRUE';
  }
  if (trimmed.toLowerCase() === 'false') {
    return 'FALSE';
  }

  // Integer or float
  if (/^-?\d+(\.\d+)?([eE][-+]?\d+)?$/.test(trimmed)) {
    return trimmed;
  }

  // Quoted SQL string
  return `'${escapeSqlString(val)}'`;
}
