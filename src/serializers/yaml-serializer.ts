/**
 * YAML Serializer - Converts JSON to YAML format
 */

import type { YamlSerializeOptions } from '../types/yaml.js';
import type { JsonValue, JsonObject } from '../types/common.js';
import { DataConversionError } from '../errors/index.js';

export class YamlSerializer {
  private readonly indentSize: number;
  private readonly preferQuotes: boolean;
  private readonly lineEnding: string;
  private readonly serializeUndefined: boolean;
  private readonly maxDepth: number;
  private readonly maxStringLength: number;
  private depth = 0;

  constructor(options: YamlSerializeOptions = {}) {
    this.indentSize = options.indentSize ?? 2;
    this.preferQuotes = options.preferQuotes ?? false;
    this.lineEnding = options.lineEnding ?? '\n';
    this.serializeUndefined = options.serializeUndefined !== false;
    this.maxDepth = options.maxDepth ?? 100;
    this.maxStringLength = options.maxStringLength ?? 1048576;
  }

  public serialize(data: JsonValue): string {
    if (data === null) {
      return 'null';
    }

    if (typeof data === 'string') {
      return this.serializeString(data);
    }

    if (typeof data === 'number') {
      return String(data);
    }

    if (typeof data === 'boolean') {
      return data ? 'true' : 'false';
    }

    if (Array.isArray(data)) {
      return this.serializeArray(data);
    }

    if (typeof data === 'object') {
      return this.serializeObject(data as JsonObject);
    }

    throw new DataConversionError('Unsupported value type', {
      to: 'YAML',
      context: { type: typeof data }
    });
  }

  private serializeObject(obj: JsonObject): string {
    if (this.depth >= this.maxDepth) {
      throw new DataConversionError('Maximum nesting depth exceeded', {
        to: 'YAML',
        context: { maxDepth: this.maxDepth }
      });
    }

    const keys = Object.keys(obj);
    if (keys.length === 0) {
      return '{}';
    }

    this.depth++;
    const lines: string[] = [];

    for (const key of keys) {
      const value = obj[key];

      if (value === undefined && !this.serializeUndefined) {
        continue;
      }

      const escapedKey = this.escapeKey(key);

      if (
        value === null ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        const serializedValue = this.serializeValue(value);
        lines.push(`${escapedKey}: ${serializedValue}`);
      } else if (Array.isArray(value)) {
        if (value.length === 0) {
          lines.push(`${escapedKey}: []`);
        } else {
          lines.push(`${escapedKey}:`);
          const arrStr = this.serializeArray(value);
          for (const line of arrStr.split(this.lineEnding)) {
            lines.push(' '.repeat(this.indentSize) + line);
          }
        }
      } else if (typeof value === 'object') {
        const subKeys = Object.keys(value as JsonObject);
        if (subKeys.length === 0) {
          lines.push(`${escapedKey}: {}`);
        } else {
          lines.push(`${escapedKey}:`);
          const objStr = this.serializeObject(value as JsonObject);
          for (const line of objStr.split(this.lineEnding)) {
            lines.push(' '.repeat(this.indentSize) + line);
          }
        }
      } else {
        const serializedValue = this.serializeValue(value as JsonValue);
        lines.push(`${escapedKey}: ${serializedValue}`);
      }
    }

    this.depth--;
    return lines.join(this.lineEnding);
  }

  private serializeArray(arr: JsonValue[]): string {
    if (this.depth >= this.maxDepth) {
      throw new DataConversionError('Maximum nesting depth exceeded', {
        to: 'YAML',
        context: { maxDepth: this.maxDepth }
      });
    }

    if (arr.length === 0) {
      return '[]';
    }

    this.depth++;
    const lines: string[] = [];

    for (const item of arr) {
      if (
        item === null ||
        typeof item === 'string' ||
        typeof item === 'number' ||
        typeof item === 'boolean'
      ) {
        const serializedItem = this.serializeValue(item);
        lines.push(`- ${serializedItem}`);
      } else if (Array.isArray(item)) {
        if (item.length === 0) {
          lines.push('- []');
        } else {
          lines.push('-');
          const subArrStr = this.serializeArray(item);
          for (const line of subArrStr.split(this.lineEnding)) {
            lines.push(' '.repeat(this.indentSize) + line);
          }
        }
      } else if (typeof item === 'object') {
        const subKeys = Object.keys(item as JsonObject);
        if (subKeys.length === 0) {
          lines.push('- {}');
        } else {
          lines.push('-');
          const objStr = this.serializeObject(item as JsonObject);
          for (const line of objStr.split(this.lineEnding)) {
            lines.push(' '.repeat(this.indentSize) + line);
          }
        }
      } else {
        const serializedItem = this.serializeValue(item as JsonValue);
        lines.push(`- ${serializedItem}`);
      }
    }

    this.depth--;
    return lines.join(this.lineEnding);
  }

  private serializeValue(value: JsonValue): string {
    if (value === null) {
      return 'null';
    }

    if (typeof value === 'string') {
      return this.serializeString(value);
    }

    if (typeof value === 'number') {
      return String(value);
    }

    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }

    if (Array.isArray(value)) {
      return this.serializeArray(value);
    }

    if (typeof value === 'object') {
      return this.serializeObject(value as JsonObject);
    }

    return '';
  }

  private serializeString(str: string): string {
    if (str.length > this.maxStringLength) {
      throw new DataConversionError('String exceeds maximum length', {
        to: 'YAML',
        context: { maxLength: this.maxStringLength }
      });
    }

    // Check if string needs quotes
    if (str === '') {
      return '""';
    }

    // Check for special YAML values that need quoting
    if (
      str === 'null' ||
      str === 'true' ||
      str === 'false' ||
      str === 'yes' ||
      str === 'no' ||
      str === 'on' ||
      str === 'off' ||
      /^[-+]?(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?$/.test(str) ||
      /^[-+]?0x[0-9a-fA-F]+$/.test(str) ||
      /^[-+]?0o[0-7]+$/.test(str) ||
      /^[-+]?(\.inf|\.Inf|\.INF|\.nan|\.NaN|\.NAN)$/.test(str)
    ) {
      return `"${this.escapeString(str)}"`;
    }

    // Check for characters that require quoting
    if (
      str.includes(':') ||
      str.includes('#') ||
      str.includes('{') ||
      str.includes('}') ||
      str.includes('[') ||
      str.includes(']') ||
      str.includes(',') ||
      str.includes('&') ||
      str.includes('*') ||
      str.includes('!') ||
      str.includes('|') ||
      str.includes('>') ||
      str.includes('"') ||
      str.includes("'") ||
      str.includes('\n') ||
      str.includes('\r') ||
      str.startsWith(' ') ||
      str.endsWith(' ') ||
      this.preferQuotes
    ) {
      return `"${this.escapeString(str)}"`;
    }

    return str;
  }

  private escapeString(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  }

  private escapeKey(key: string): string {
    if (
      /^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(key) &&
      key !== 'null' &&
      key !== 'true' &&
      key !== 'false'
    ) {
      return key;
    }

    return `"${this.escapeString(key)}"`;
  }

  private indentLines(text: string, spaces: number): string {
    const indent = ' '.repeat(spaces);
    return text
      .split(this.lineEnding)
      .map(line => indent + line)
      .join(this.lineEnding);
  }
}

export function serializeYaml(data: JsonValue, options?: YamlSerializeOptions): string {
  const serializer = new YamlSerializer(options);
  return serializer.serialize(data);
}
