/**
 * YAML to JSON Converter
 */

import type { YamlParseOptions, YamlValue } from '../types/yaml.js';
import { parseYaml } from '../parsers/yaml-parser.js';

export interface YamlToJsonOptions extends YamlParseOptions {
  // Additional options can be added here
}

/**
 * Convert YAML string to JSON
 * @param yaml YAML formatted string
 * @param options Conversion options
 * @returns Parsed YAML as JSON value
 */
export function yamlToJson(yaml: string, options?: YamlToJsonOptions): YamlValue {
  return parseYaml(yaml, options);
}
