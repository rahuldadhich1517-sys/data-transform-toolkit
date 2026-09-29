/**
 * YAML Formatter
 * Parses and re-formats YAML with consistent indentation and styling.
 */

import { parseYaml } from '../parsers/yaml-parser.js';
import { serializeYaml } from '../serializers/yaml-serializer.js';
import type { YamlSerializeOptions } from '../types/yaml.js';
import { InvalidInputError } from '../errors/index.js';

export interface YamlFormatOptions extends YamlSerializeOptions {
  /** Indentation size in spaces. Defaults to 2 */
  indentSize?: number;
}

/**
 * Format and normalize YAML string
 */
export function yamlFormat(
  yaml: string,
  options: YamlFormatOptions = {}
): string {
  if (typeof yaml !== 'string') {
    throw new InvalidInputError('Input must be a string');
  }

  const trimmed = yaml.trim();
  if (!trimmed) {
    return '';
  }

  const parsed = parseYaml(yaml);
  return serializeYaml(parsed, {
    indentSize: options.indentSize ?? 2,
    ...options
  });
}
