/**
 * JSON to YAML Converter
 */

import type { YamlSerializeOptions } from '../types/yaml.js';
import type { JsonValue } from '../types/common.js';
import { serializeYaml } from '../serializers/yaml-serializer.js';

export interface JsonToYamlOptions extends YamlSerializeOptions {
  // Additional options can be added here
}

/**
 * Convert JSON to YAML format
 * @param data JSON value to convert
 * @param options Conversion options
 * @returns YAML formatted string
 */
export function jsonToYaml(data: JsonValue, options?: JsonToYamlOptions): string {
  return serializeYaml(data, options);
}
