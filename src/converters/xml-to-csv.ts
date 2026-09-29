/**
 * XML to CSV Converter
 */

import { parseXml } from '../parsers/xml-parser.js';
import { serializeCsv } from '../serializers/csv-serializer.js';
import { InvalidInputError } from '../errors/index.js';

export interface XmlToCsvOptions {
  /** Dot-delimited path to the array of records inside parsed XML. E.g. 'users.user' */
  recordPath?: string;
  /** Separator for flattening nested keys in CSV headers. Defaults to '.' */
  nestedSeparator?: string;
  /** Delimiter to use in CSV output. Defaults to ',' */
  delimiter?: string;
}

/**
 * Flatten XML records into a CSV string
 */
export function xmlToCsv(
  xml: string,
  options: XmlToCsvOptions = {}
): string {
  if (typeof xml !== 'string') {
    throw new InvalidInputError('Input must be a string');
  }

  const trimmed = xml.trim();
  if (!trimmed) {
    return '';
  }

  const parsed = parseXml(xml);
  const recordPath = options.recordPath;
  const sep = options.nestedSeparator ?? '.';

  let records: unknown[] = [];

  if (recordPath) {
    const parts = recordPath.split('.');
    let cur: unknown = parsed;
    for (const part of parts) {
      if (cur && typeof cur === 'object') {
        cur = (cur as Record<string, unknown>)[part];
      } else {
        cur = undefined;
        break;
      }
    }

    if (Array.isArray(cur)) {
      records = cur;
    } else if (cur && typeof cur === 'object') {
      records = [cur];
    }
  } else {
    // Auto-detect array of records: look under root element
    const rootKeys = Object.keys(parsed);
    if (rootKeys.length === 1) {
      const rootVal = parsed[rootKeys[0]!];
      if (Array.isArray(rootVal)) {
        records = rootVal;
      } else if (rootVal && typeof rootVal === 'object') {
        const childKeys = Object.keys(rootVal as Record<string, unknown>);
        // Check if there is an array child
        const arrayKey = childKeys.find(k => Array.isArray((rootVal as Record<string, unknown>)[k]));
        if (arrayKey) {
          records = (rootVal as Record<string, unknown>)[arrayKey] as unknown[];
        } else {
          records = [rootVal];
        }
      }
    } else {
      records = [parsed];
    }
  }

  if (records.length === 0) {
    return '';
  }

  // Flatten each record
  const flattenedRecords = records.map(rec => {
    if (rec && typeof rec === 'object') {
      return flattenObject(rec as Record<string, unknown>, '', sep);
    }
    return { value: rec };
  });

  return serializeCsv(flattenedRecords, { delimiter: options.delimiter ?? ',' });
}

function flattenObject(
  obj: Record<string, unknown>,
  prefix = '',
  sep = '.'
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}${sep}${key}` : key;
    if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      Object.assign(result, flattenObject(val as Record<string, unknown>, fullKey, sep));
    } else {
      result[fullKey] = val;
    }
  }

  return result;
}
