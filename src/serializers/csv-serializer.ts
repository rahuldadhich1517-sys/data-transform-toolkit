/**
 * CSV Serializer - Converts objects/arrays to CSV format
 */

import type { CsvSerializeOptions, CsvRecord } from '../types/csv.js';
import type { JsonValue, JsonObject } from '../types/common.js';
import { DataConversionError } from '../errors/index.js';

export class CsvSerializer {
  private readonly delimiter: string;
  private readonly lineEnding: string;
  private readonly quoteAllFields: boolean;
  private readonly quoteEmptyFields: boolean;
  private readonly maxDepth: number;
  private readonly headers: boolean;

  constructor(options: CsvSerializeOptions = {}) {
    this.delimiter = options.delimiter ?? ',';
    this.lineEnding = options.lineEnding ?? '\n';
    this.quoteAllFields = options.quoteAllFields ?? false;
    this.quoteEmptyFields = options.quoteEmptyFields !== false;
    this.maxDepth = options.maxDepth ?? 100;
    this.headers = options.headers !== false;
  }

  public serialize(data: unknown): string {
    if (!Array.isArray(data)) {
      throw new DataConversionError('CSV serialization requires an array of objects', {
        from: typeof data,
        to: 'CSV',
        context: { received: typeof data }
      });
    }

    if (data.length === 0) {
      return '';
    }

    // Extract all headers from all objects
    const headers = this.extractHeaders(data);

    if (headers.length === 0) {
      return '';
    }

    // Build CSV
    const rows: string[] = [];

    // Add header row
    if (this.headers) {
      rows.push(this.escapeFields(headers).join(this.delimiter));
    }

    // Add data rows
    for (const row of data) {
      const fields: string[] = [];
      for (const header of headers) {
        const value = this.getNestedValue(row as JsonObject, header);
        fields.push(this.formatValue(value));
      }
      rows.push(this.escapeFields(fields).join(this.delimiter));
    }

    return rows.join(this.lineEnding);
  }

  private extractHeaders(data: unknown[]): string[] {
    const headerSet = new Set<string>();
    const headers: string[] = [];

    for (const item of data) {
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        const obj = item as JsonObject;
        for (const key of Object.keys(obj)) {
          if (!headerSet.has(key)) {
            headerSet.add(key);
            headers.push(key);
          }
        }
      }
    }

    return headers;
  }

  private getNestedValue(obj: JsonObject, path: string): JsonValue {
    const keys = path.split('.');
    let current: unknown = obj;

    for (const key of keys) {
      if (typeof current === 'object' && current !== null && !Array.isArray(current)) {
        current = (current as JsonObject)[key];
      } else {
        return undefined as unknown as JsonValue;
      }
    }

    return current as JsonValue;
  }

  private formatValue(value: JsonValue): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }

    if (typeof value === 'number') {
      return String(value);
    }

    if (typeof value === 'string') {
      return value;
    }

    // For objects and arrays, convert to JSON (compact format)
    return JSON.stringify(value);
  }

  private escapeFields(fields: string[]): string[] {
    return fields.map((field, index) => this.escapeField(field));
  }

  private escapeField(field: string): string {
    // Check if field needs quoting
    const needsQuoting = 
      this.quoteAllFields ||
      (field !== '' && (field.includes(this.delimiter) || field.includes('"') || field.includes('\n') || field.includes('\r')));

    if (!needsQuoting) {
      return field;
    }

    // Escape quotes by doubling them
    const escaped = field.replace(/"/g, '""');
    return `"${escaped}"`;
  }
}

export function serializeCsv(data: unknown, options?: CsvSerializeOptions): string {
  const serializer = new CsvSerializer(options);
  return serializer.serialize(data);
}
