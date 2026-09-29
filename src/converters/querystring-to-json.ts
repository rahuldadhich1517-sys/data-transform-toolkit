/**
 * URL Querystring to JSON Converter
 */

import { InvalidInputError } from '../errors/index.js';

export interface QuerystringToJsonOptions {
  /** How to handle repeated keys: 'array' (default), 'last', 'first' */
  repeatedKeyStrategy?: 'array' | 'last' | 'first';
  /** If true, parse numbers and booleans. Defaults to false */
  parsePrimitives?: boolean;
  /** Value to assign to valueless keys (e.g. "?flag&other=1"). Defaults to "" */
  valuelessValue?: string | boolean;
}

/**
 * Convert URL query string into JSON object
 */
export function querystringToJson(
  queryString: string,
  options: QuerystringToJsonOptions = {}
): Record<string, unknown> {
  if (typeof queryString !== 'string') {
    throw new InvalidInputError('Input must be a string');
  }

  let qs = queryString.trim();
  if (qs.startsWith('?')) {
    qs = qs.substring(1);
  }

  if (!qs) {
    return {};
  }

  const repeatedKeyStrategy = options.repeatedKeyStrategy ?? 'array';
  const parsePrimitives = options.parsePrimitives ?? false;
  const valueless = options.valuelessValue ?? '';

  const pairs = qs.split('&');
  const result: Record<string, unknown> = {};

  for (const pair of pairs) {
    if (!pair) continue;

    const eqIdx = pair.indexOf('=');
    let rawKey = '';
    let rawVal: string | boolean = '';

    if (eqIdx === -1) {
      rawKey = pair;
      rawVal = valueless;
    } else {
      rawKey = pair.substring(0, eqIdx);
      rawVal = pair.substring(eqIdx + 1);
    }

    const key = decodeQueryComponent(rawKey);
    let val: unknown = typeof rawVal === 'string' ? decodeQueryComponent(rawVal) : rawVal;

    if (parsePrimitives && typeof val === 'string') {
      if (val.toLowerCase() === 'true') val = true;
      else if (val.toLowerCase() === 'false') val = false;
      else if (val.toLowerCase() === 'null') val = null;
      else if (/^-?\d+(\.\d+)?$/.test(val)) val = Number(val);
    }

    if (key in result) {
      if (repeatedKeyStrategy === 'first') {
        // Keep existing
      } else if (repeatedKeyStrategy === 'last') {
        result[key] = val;
      } else {
        // 'array'
        const existing = result[key];
        if (Array.isArray(existing)) {
          existing.push(val);
        } else {
          result[key] = [existing, val];
        }
      }
    } else {
      result[key] = val;
    }
  }

  return result;
}

function decodeQueryComponent(str: string): string {
  // Replace '+' with space first
  const withSpaces = str.replace(/\+/g, ' ');
  try {
    return decodeURIComponent(withSpaces);
  } catch {
    // Fall back to raw string if malformed percent encoding
    return withSpaces;
  }
}
