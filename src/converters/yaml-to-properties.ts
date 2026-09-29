/**
 * YAML to Java .properties Converter
 */

import { parseYaml } from '../parsers/yaml-parser.js';
import { escapePropertyKey, escapePropertyValue } from '../internal/escaping.js';
import { InvalidInputError } from '../errors/index.js';

export interface YamlToPropertiesOptions {
  /** Separator for nested keys. Defaults to '.' */
  separator?: string;
  /** Whether to sort keys alphabetically. Defaults to true */
  sortKeys?: boolean;
  /** Line ending ('\n' or '\r\n'). Defaults to '\n' */
  lineEnding?: '\n' | '\r\n';
}

/**
 * Convert YAML text into a Java .properties formatted string
 */
export function yamlToProperties(
  yaml: string,
  options: YamlToPropertiesOptions = {}
): string {
  if (typeof yaml !== 'string') {
    throw new InvalidInputError('Input must be a string');
  }

  const trimmed = yaml.trim();
  if (!trimmed) {
    return '';
  }

  const parsed = parseYaml(yaml);
  if (parsed === null || typeof parsed !== 'object') {
    return '';
  }

  const sep = options.separator ?? '.';
  const sortKeys = options.sortKeys !== false;
  const lineEnding = options.lineEnding ?? '\n';

  const flatMap: Record<string, string> = {};

  function flatten(cur: unknown, prefix: string) {
    if (cur === null || cur === undefined) {
      flatMap[prefix] = '';
    } else if (Array.isArray(cur)) {
      for (let i = 0; i < cur.length; i++) {
        const itemKey = `${prefix}[${i}]`;
        flatten(cur[i], itemKey);
      }
    } else if (typeof cur === 'object') {
      for (const [key, val] of Object.entries(cur as Record<string, unknown>)) {
        const fullKey = prefix ? `${prefix}${sep}${key}` : key;
        flatten(val, fullKey);
      }
    } else {
      flatMap[prefix] = String(cur);
    }
  }

  flatten(parsed, '');

  const keys = Object.keys(flatMap);
  if (sortKeys) {
    keys.sort();
  }

  const lines = keys.map(k => {
    const escapedKey = escapePropertyKey(k);
    const escapedVal = escapePropertyValue(flatMap[k]!);
    return `${escapedKey}=${escapedVal}`;
  });

  return lines.join(lineEnding);
}
