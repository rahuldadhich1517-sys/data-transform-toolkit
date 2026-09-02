/**
 * CSV Parser - Converts CSV text to array of objects
 * Uses a state machine to handle proper CSV parsing
 */

import type { CsvParseOptions, CsvRecord } from '../types/csv.js';
import { CsvParseError } from '../errors/index.js';

interface ParserState {
  field: string;
  inQuotes: boolean;
  afterQuote: boolean;
}

export class CsvParser {
  private readonly delimiter: string;
  private readonly headers: boolean;
  private readonly trim: boolean;
  private readonly parseNumbers: boolean;
  private readonly parseBooleans: boolean;
  private readonly strict: boolean;
  private readonly maxFieldLength: number;

  constructor(options: CsvParseOptions = {}) {
    this.delimiter = options.delimiter ?? ',';
    this.headers = options.headers !== false;
    this.trim = options.trim ?? false;
    this.parseNumbers = options.parseNumbers ?? false;
    this.parseBooleans = options.parseBooleans ?? false;
    this.strict = options.strict ?? false;
    this.maxFieldLength = options.maxFieldLength ?? 1048576;
  }

  public parse(csv: string): CsvRecord[] {
    if (typeof csv !== 'string') {
      throw new CsvParseError('Input must be a string', { context: { type: typeof csv } });
    }

    if (csv.length === 0) {
      return [];
    }

    const lines = this.splitLines(csv);
    
    if (lines.length === 0) {
      return [];
    }

    let headerRow: (string | null)[] | null = null;
    const records: CsvRecord[] = [];

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex]!;
      const fields = this.parseLine(line, lineIndex);

      if (lineIndex === 0 && this.headers) {
        headerRow = fields;
      } else {
        if (!headerRow && this.headers) {
          headerRow = [];
          for (let i = 0; i < fields.length; i++) {
            headerRow.push(`column_${i}`);
          }
        }

        const record = this.fieldsToRecord(fields, headerRow, lineIndex);
        records.push(record);
      }
    }

    return records;
  }

  private splitLines(csv: string): string[] {
    const lines: string[] = [];
    let currentLine = '';
    let inQuotes = false;

    for (let i = 0; i < csv.length; i++) {
      const char = csv[i];
      const nextChar = csv[i + 1];

      if (char === '"') {
        currentLine += char;
        if (nextChar === '"') {
          currentLine += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++; // Skip LF in CRLF
        }
        if (currentLine) {
          lines.push(currentLine);
          currentLine = '';
        }
      } else {
        currentLine += char;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  private parseLine(line: string, lineIndex: number): (string | null)[] {
    const fields: (string | null)[] = [];
    let state: ParserState = {
      field: '',
      inQuotes: false,
      afterQuote: false
    };

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (state.field.length > this.maxFieldLength) {
        throw new CsvParseError('Field exceeds maximum length', {
          line: lineIndex + 1,
          context: { maxLength: this.maxFieldLength }
        });
      }

      if (!state.inQuotes && char === this.delimiter) {
        fields.push(this.processField(state.field));
        state.field = '';
        state.afterQuote = false;
      } else if (char === '"') {
        if (state.field === '' && !state.inQuotes) {
          // Starting quoted field
          state.inQuotes = true;
        } else if (state.inQuotes && nextChar === '"') {
          // Escaped quote
          state.field += '"';
          i++; // Skip next quote
        } else if (state.inQuotes) {
          // Ending quoted field
          state.inQuotes = false;
          state.afterQuote = true;
        } else if (this.strict) {
          throw new CsvParseError('Unexpected quote', {
            line: lineIndex + 1,
            column: i + 1,
            context: { char }
          });
        } else {
          state.field += char;
        }
      } else if (state.inQuotes || (state.field === '' && char === ' ' && !this.trim)) {
        state.field += char;
      } else if (state.afterQuote && (char === ' ' || char === this.delimiter)) {
        // Allow trailing whitespace after closing quote
        if (char === this.delimiter) {
          fields.push(this.processField(state.field));
          state.field = '';
          state.afterQuote = false;
        } else {
          state.field += char;
        }
      } else {
        state.field += char;
      }
    }

    if (state.inQuotes && this.strict) {
      throw new CsvParseError('Unclosed quoted field', {
        line: lineIndex + 1,
        context: { position: state.field.length }
      });
    }

    fields.push(this.processField(state.field));

    return fields;
  }

  private processField(field: string): string | null {
    let processed = field;

    if (this.trim) {
      processed = processed.trim();
    }

    if (processed === '' || processed === 'null') {
      return null;
    }

    if (this.parseBooleans) {
      if (processed === 'true') return 'true'; // Keep as string for now, let type coercion handle
      if (processed === 'false') return 'false';
    }

    if (this.parseNumbers && /^-?\d+(\.\d+)?$/.test(processed)) {
      return processed; // Return numeric string, caller will convert
    }

    return processed;
  }

  private fieldsToRecord(fields: (string | null)[], headers: (string | null)[] | null, _lineIndex: number): CsvRecord {
    const record: CsvRecord = {};
    
    // If no headers, use column_X naming
    if (!headers) {
      for (let i = 0; i < fields.length; i++) {
        const value = fields[i];
        let processedValue: string | null = value;

        if (processedValue === null) {
          processedValue = null;
        } else if (this.parseBooleans && (processedValue === 'true' || processedValue === 'false')) {
          // Keep as string representation for compatibility
        } else if (this.parseNumbers && typeof processedValue === 'string' && /^-?\d+(\.\d+)?$/.test(processedValue)) {
          // Keep as string representation for compatibility
        }

        record[`column_${i}`] = processedValue;
      }
      return record;
    }

    // Process all headers, adding null for missing fields
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i] ?? `column_${i}`;
      const value = fields[i] ?? null;

      let processedValue: string | null = value;

      if (processedValue === null) {
        processedValue = null;
      } else if (this.parseBooleans && (processedValue === 'true' || processedValue === 'false')) {
        // Keep as string representation for compatibility
      } else if (this.parseNumbers && typeof processedValue === 'string' && /^-?\d+(\.\d+)?$/.test(processedValue)) {
        // Keep as string representation for compatibility
      }

      record[header] = processedValue;
    }

    return record;
  }
}

export function parseCsv(csv: string, options?: CsvParseOptions): CsvRecord[] {
  const parser = new CsvParser(options);
  return parser.parse(csv);
}
