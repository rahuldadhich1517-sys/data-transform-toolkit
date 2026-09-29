/**
 * Text to JSON Converter
 */

import { InvalidInputError } from '../errors/index.js';

export interface TextToJsonOptions {
  /** Separator between key and value. Defaults to ':' or '=' */
  separator?: string;
  /** Duplicate key strategy: 'last' (default), 'first', 'array', 'error' */
  duplicateKeyStrategy?: 'last' | 'first' | 'array' | 'error';
  /** If true, trim whitespace from keys and values. Defaults to true */
  trim?: boolean;
  /** If true, parse numbers and booleans instead of keeping strings. Defaults to false */
  parsePrimitives?: boolean;
}

/**
 * Convert key-value text lines into JSON object
 */
export function textToJson(
  textContent: string,
  options: TextToJsonOptions = {}
): Record<string, unknown> {
  if (typeof textContent !== 'string') {
    throw new InvalidInputError('Input must be a string');
  }

  const dupStrategy = options.duplicateKeyStrategy ?? 'last';
  const trim = options.trim !== false;
  const parsePrimitives = options.parsePrimitives ?? false;

  const lines = textContent.split(/\r?\n/);
  const result: Record<string, unknown> = {};

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const rawLine = lines[lineIndex]!;
    const line = trim ? rawLine.trim() : rawLine;

    // Skip empty lines and comment lines
    if (!line || line.startsWith('#') || line.startsWith('//')) {
      continue;
    }

    let key = '';
    let valStr = '';

    if (options.separator) {
      const idx = line.indexOf(options.separator);
      if (idx === -1) {
        throw new InvalidInputError(`Separator "${options.separator}" not found in line ${lineIndex + 1}`, {
          context: { line: lineIndex + 1 }
        });
      }
      key = line.substring(0, idx);
      valStr = line.substring(idx + options.separator.length);
    } else {
      // Auto-detect ':' or '='
      const colonIdx = line.indexOf(':');
      const eqIdx = line.indexOf('=');

      let sepIdx = -1;
      let sepLen = 1;

      if (colonIdx !== -1 && eqIdx !== -1) {
        sepIdx = Math.min(colonIdx, eqIdx);
      } else if (colonIdx !== -1) {
        sepIdx = colonIdx;
      } else if (eqIdx !== -1) {
        sepIdx = eqIdx;
      }

      if (sepIdx === -1) {
        throw new InvalidInputError(`No key-value separator found in line ${lineIndex + 1}`, {
          context: { line: lineIndex + 1 }
        });
      }

      key = line.substring(0, sepIdx);
      valStr = line.substring(sepIdx + sepLen);
    }

    if (trim) {
      key = key.trim();
      valStr = valStr.trim();
    }

    let parsedVal: unknown = valStr;

    // Unquote if quoted
    if ((valStr.startsWith('"') && valStr.endsWith('"') && valStr.length >= 2) ||
        (valStr.startsWith("'") && valStr.endsWith("'") && valStr.length >= 2)) {
      parsedVal = valStr.substring(1, valStr.length - 1);
    } else if (parsePrimitives) {
      if (valStr.toLowerCase() === 'true') parsedVal = true;
      else if (valStr.toLowerCase() === 'false') parsedVal = false;
      else if (valStr.toLowerCase() === 'null') parsedVal = null;
      else if (/^-?\d+(\.\d+)?$/.test(valStr)) parsedVal = Number(valStr);
    }

    if (key in result) {
      if (dupStrategy === 'error') {
        throw new InvalidInputError(`Duplicate key "${key}" found at line ${lineIndex + 1}`, {
          context: { key, line: lineIndex + 1 }
        });
      } else if (dupStrategy === 'first') {
        // keep existing
      } else if (dupStrategy === 'array') {
        const existing = result[key];
        if (Array.isArray(existing)) {
          existing.push(parsedVal);
        } else {
          result[key] = [existing, parsedVal];
        }
      } else {
        result[key] = parsedVal;
      }
    } else {
      result[key] = parsedVal;
    }
  }

  return result;
}
