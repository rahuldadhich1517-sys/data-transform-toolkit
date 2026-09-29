/**
 * YAML to TOML Converter
 */

import { parseYaml } from '../parsers/yaml-parser.js';
import { stringify as stringifyToml } from 'smol-toml';
import { InvalidInputError } from '../errors/index.js';

export interface YamlToTomlOptions {
  // Configurable options
}

/**
 * Convert YAML text into a TOML string
 */
export function yamlToToml(
  yaml: string,
  _options: YamlToTomlOptions = {}
): string {
  if (typeof yaml !== 'string') {
    throw new InvalidInputError('Input must be a string');
  }

  const trimmed = yaml.trim();
  if (!trimmed) {
    return '';
  }

  const parsed = parseYaml(yaml);

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new InvalidInputError('TOML root must be a table (key-value object), received ' + (Array.isArray(parsed) ? 'array' : typeof parsed));
  }

  try {
    return stringifyToml(parsed as Record<string, unknown>);
  } catch (err: unknown) {
    throw new InvalidInputError(`Failed to convert YAML structure to TOML: ${(err as Error).message}`);
  }
}
