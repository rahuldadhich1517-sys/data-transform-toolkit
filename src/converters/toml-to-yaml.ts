/**
 * TOML to YAML Converter
 */

import { tomlToJson } from './toml-to-json.js';
import { serializeYaml } from '../serializers/yaml-serializer.js';
import type { YamlSerializeOptions } from '../types/yaml.js';
import { InvalidInputError } from '../errors/index.js';

export interface TomlToYamlOptions extends YamlSerializeOptions {
  // Configurable options
}

/**
 * Convert TOML formatted string into a YAML string
 */
export function tomlToYaml(
  toml: string,
  options: TomlToYamlOptions = {}
): string {
  if (typeof toml !== 'string') {
    throw new InvalidInputError('Input must be a string');
  }

  const data = tomlToJson(toml);
  return serializeYaml(data as unknown as import('../types/common.js').JsonValue, options);
}
