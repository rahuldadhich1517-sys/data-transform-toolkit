/**
 * Safe SQL INSERT statement parser
 * Never executes SQL. Extracts table, columns, and values into data structures.
 */

import { SqlParseError } from '../errors/index.js';

export interface ParsedSqlInsert {
  tableName: string;
  columns: string[];
  rows: (string | number | boolean | null)[][];
  records: Record<string, string | number | boolean | null>[];
}

export function parseSqlInsert(sql: string, options: { strict?: boolean } = {}): ParsedSqlInsert {
  const trimmed = sql.trim();
  if (!trimmed) {
    throw new SqlParseError('SQL input is empty');
  }

  let i = 0;
  let line = 1;
  let col = 1;

  function skipWhitespace() {
    while (i < trimmed.length) {
      const c = trimmed[i];
      if (c === '\n') {
        line++;
        col = 1;
        i++;
      } else if (/\s/.test(c)) {
        col++;
        i++;
      } else if (trimmed.startsWith('--', i)) {
        // Comment to end of line
        while (i < trimmed.length && trimmed[i] !== '\n') {
          i++;
        }
      } else {
        break;
      }
    }
  }

  skipWhitespace();

  // Match INSERT INTO
  const insertMatch = trimmed.substring(i).match(/^INSERT\s+INTO\s+/i);
  if (!insertMatch) {
    throw new SqlParseError('Expected "INSERT INTO"', { line, column: col });
  }
  i += insertMatch[0].length;
  col += insertMatch[0].length;

  skipWhitespace();

  // Extract table name (supports quotes e.g. "users", `users`, [users], or unquoted users)
  let tableName = '';
  if (trimmed[i] === '"' || trimmed[i] === '`' || trimmed[i] === '[') {
    const closeQuote = trimmed[i] === '[' ? ']' : trimmed[i];
    i++;
    col++;
    const start = i;
    while (i < trimmed.length && trimmed[i] !== closeQuote) {
      i++;
      col++;
    }
    if (i >= trimmed.length) {
      throw new SqlParseError('Unclosed quote in table name', { line, column: col });
    }
    tableName = trimmed.substring(start, i);
    i++; // skip quote
    col++;
  } else {
    const tableMatch = trimmed.substring(i).match(/^[a-zA-Z0-9_.]+/);
    if (!tableMatch) {
      throw new SqlParseError('Invalid table name', { line, column: col });
    }
    tableName = tableMatch[0];
    i += tableName.length;
    col += tableName.length;
  }

  skipWhitespace();

  // Optional column list: (col1, col2, ...)
  const columns: string[] = [];
  if (trimmed[i] === '(') {
    i++; // skip '('
    col++;
    skipWhitespace();

    while (i < trimmed.length && trimmed[i] !== ')') {
      skipWhitespace();
      let colName = '';
      if (trimmed[i] === '"' || trimmed[i] === '`' || trimmed[i] === '[') {
        const closeQuote = trimmed[i] === '[' ? ']' : trimmed[i];
        i++;
        col++;
        const start = i;
        while (i < trimmed.length && trimmed[i] !== closeQuote) {
          i++;
          col++;
        }
        colName = trimmed.substring(start, i);
        i++;
        col++;
      } else {
        const match = trimmed.substring(i).match(/^[a-zA-Z0-9_]+/);
        if (!match) {
          throw new SqlParseError('Invalid column name', { line, column: col });
        }
        colName = match[0];
        i += colName.length;
        col += colName.length;
      }

      columns.push(colName);
      skipWhitespace();

      if (trimmed[i] === ',') {
        i++;
        col++;
        skipWhitespace();
      } else if (trimmed[i] !== ')') {
        throw new SqlParseError('Expected "," or ")" in column list', { line, column: col });
      }
    }

    if (trimmed[i] !== ')') {
      throw new SqlParseError('Unclosed column list, expected ")"', { line, column: col });
    }
    i++; // skip ')'
    col++;
  }

  skipWhitespace();

  // Match VALUES keyword
  const valuesMatch = trimmed.substring(i).match(/^VALUES\s*/i);
  if (!valuesMatch) {
    throw new SqlParseError('Expected "VALUES"', { line, column: col });
  }
  i += valuesMatch[0].length;
  col += valuesMatch[0].length;

  skipWhitespace();

  // Parse value tuples: (val1, val2), (val3, val4);
  const rows: (string | number | boolean | null)[][] = [];

  while (i < trimmed.length) {
    skipWhitespace();
    if (i >= trimmed.length || trimmed[i] === ';') {
      break;
    }

    if (trimmed[i] !== '(') {
      throw new SqlParseError(`Expected "(" to start row values, got "${trimmed[i]}"`, { line, column: col });
    }
    i++; // skip '('
    col++;

    const row: (string | number | boolean | null)[] = [];

    while (i < trimmed.length && trimmed[i] !== ')') {
      skipWhitespace();

      let val: string | number | boolean | null = null;

      if (trimmed[i] === "'") {
        // String literal
        i++;
        col++;
        let str = '';
        while (i < trimmed.length) {
          if (trimmed[i] === "'") {
            if (trimmed[i + 1] === "'") {
              // Escaped single quote
              str += "'";
              i += 2;
              col += 2;
            } else {
              i++; // End string
              col++;
              break;
            }
          } else {
            str += trimmed[i];
            i++;
            col++;
          }
        }
        val = str;
      } else if (trimmed.substring(i, i + 4).toUpperCase() === 'NULL' && !/[a-zA-Z0-9_]/.test(trimmed[i + 4] || '')) {
        val = null;
        i += 4;
        col += 4;
      } else if (trimmed.substring(i, i + 4).toUpperCase() === 'TRUE' && !/[a-zA-Z0-9_]/.test(trimmed[i + 4] || '')) {
        val = true;
        i += 4;
        col += 4;
      } else if (trimmed.substring(i, i + 5).toUpperCase() === 'FALSE' && !/[a-zA-Z0-9_]/.test(trimmed[i + 5] || '')) {
        val = false;
        i += 5;
        col += 5;
      } else {
        // Number or unquoted identifier/expression
        const numMatch = trimmed.substring(i).match(/^-?\d+(\.\d+)?([eE][-+]?\d+)?/);
        if (numMatch) {
          val = Number(numMatch[0]);
          i += numMatch[0].length;
          col += numMatch[0].length;
        } else {
          // Fallback literal
          const literalMatch = trimmed.substring(i).match(/^[^,)\s]+/);
          if (literalMatch) {
            val = literalMatch[0];
            i += literalMatch[0].length;
            col += literalMatch[0].length;
          } else {
            val = null;
          }
        }
      }

      row.push(val);
      skipWhitespace();

      if (trimmed[i] === ',') {
        i++;
        col++;
        skipWhitespace();
      } else if (trimmed[i] !== ')') {
        throw new SqlParseError('Expected "," or ")" in row values', { line, column: col });
      }
    }

    if (trimmed[i] !== ')') {
      throw new SqlParseError('Unclosed row values tuple', { line, column: col });
    }
    i++; // skip ')'
    col++;

    rows.push(row);
    skipWhitespace();

    if (trimmed[i] === ',') {
      i++;
      col++;
      skipWhitespace();
    } else if (trimmed[i] === ';') {
      i++;
      break;
    }
  }

  // Derive columns if not explicitly provided
  const finalCols = [...columns];
  if (finalCols.length === 0 && rows.length > 0) {
    const maxCols = Math.max(...rows.map(r => r.length));
    for (let c = 0; c < maxCols; c++) {
      finalCols.push(`column_${c + 1}`);
    }
  }

  // Convert to records
  const records = rows.map(r => {
    const rec: Record<string, string | number | boolean | null> = {};
    for (let c = 0; c < finalCols.length; c++) {
      rec[finalCols[c]!] = r[c] !== undefined ? r[c]! : null;
    }
    return rec;
  });

  return {
    tableName,
    columns: finalCols,
    rows,
    records
  };
}
