/**
 * TOML to JSON Converter
 */

import { parseToml } from '../internal/toml.js';
import { TomlParseError, InvalidInputError } from '../errors/index.js';

export interface TomlToJsonOptions {
  // Configurable options if needed
}

/**
 * Convert TOML formatted string into a JavaScript/JSON object
 */
export function tomlToJson(
  toml: string,
  _options: TomlToJsonOptions = {}
): Record<string, unknown> {
  if (typeof toml !== 'string') {
    throw new InvalidInputError('Input must be a string');
  }

  const trimmed = toml.trim();
  if (!trimmed) {
    return {};
  }

  try {
    const parsed = parseToml(toml);
    // Convert Dates to ISO strings for JSON compatibility
    return normalizeTomlValues(parsed) as Record<string, unknown>;
  } catch (err: unknown) {
    const error = err as Error & { line?: number; column?: number };
    throw new TomlParseError(`Failed to parse TOML: ${error.message}`, {
      line: error.line,
      column: error.column
    });
  }
}

function normalizeTomlValues(val: unknown): unknown {
  if (val instanceof Date) {
    return val.toISOString();
  }
  if (Array.isArray(val)) {
    return val.map(normalizeTomlValues);
  }
  if (val && typeof val === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val)) {
      result[k] = normalizeTomlValues(v);
    }
    return result;
  }
  return val;
}
