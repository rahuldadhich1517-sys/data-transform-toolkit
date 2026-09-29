/**
 * JSON to ENV Converter
 */

import { InvalidInputError } from '../errors/index.js';

export interface JsonToEnvOptions {
  /** If true, sort keys alphabetically for deterministic output. Defaults to true */
  sortKeys?: boolean;
  /** Newline character to use ('\n' or '\r\n'). Defaults to '\n' */
  lineEnding?: '\n' | '\r\n';
  /** If true, flatten nested objects with prefix delimiter. Defaults to false (throws error on nested objects) */
  flatten?: boolean;
  /** Delimiter to use when flattening nested objects. Defaults to '__' */
  flattenDelimiter?: string;
  /** Prefix with 'export ' for all variables. Defaults to false */
  exportPrefix?: boolean;
}

/**
 * Convert JSON object into .env file lines
 */
export function jsonToEnv(
  input: Record<string, unknown>,
  options: JsonToEnvOptions = {}
): string {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new InvalidInputError('Input must be a non-null object', {
      expected: 'object',
      received: input === null ? 'null' : Array.isArray(input) ? 'array' : typeof input
    });
  }

  const sortKeys = options.sortKeys !== false;
  const lineEnding = options.lineEnding ?? '\n';
  const flatten = options.flatten ?? false;
  const delimiter = options.flattenDelimiter ?? '__';
  const prefix = options.exportPrefix ? 'export ' : '';

  const flatMap: Record<string, string> = {};

  function processObj(obj: Record<string, unknown>, currentPrefix = '') {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = currentPrefix ? `${currentPrefix}${delimiter}${key}` : key;

      // Validate key
      if (!/^[a-zA-Z_][a-zA-Z0-9_.-]*$/.test(fullKey)) {
        throw new InvalidInputError(`Invalid environment variable key: "${fullKey}"`, {
          context: { key: fullKey }
        });
      }

      if (value === null || value === undefined) {
        flatMap[fullKey] = '';
      } else if (typeof value === 'object') {
        if (!flatten) {
          throw new InvalidInputError(`Nested object found at key "${fullKey}". Set options.flatten: true to flatten nested keys.`, {
            context: { key: fullKey }
          });
        }
        if (Array.isArray(value)) {
          flatMap[fullKey] = JSON.stringify(value);
        } else {
          processObj(value as Record<string, unknown>, fullKey);
        }
      } else {
        flatMap[fullKey] = String(value);
      }
    }
  }

  processObj(input);

  const keys = Object.keys(flatMap);
  if (sortKeys) {
    keys.sort();
  }

  const lines = keys.map(key => {
    const rawVal = flatMap[key]!;
    const escapedVal = formatEnvValue(rawVal);
    return `${prefix}${key}=${escapedVal}`;
  });

  return lines.join(lineEnding);
}

function formatEnvValue(val: string): string {
  if (val === '') {
    return '';
  }

  const needsQuotes =
    val.includes(' ') ||
    val.includes('\t') ||
    val.includes('\n') ||
    val.includes('\r') ||
    val.includes('"') ||
    val.includes("'") ||
    val.includes('#') ||
    val.includes('=') ||
    val.includes('$');

  if (!needsQuotes) {
    return val;
  }

  // Quote and escape with double quotes
  const escaped = val
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');

  return `"${escaped}"`;
}
