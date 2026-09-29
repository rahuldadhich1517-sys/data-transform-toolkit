/**
 * XML to YAML Converter
 */

import { parseXml } from '../parsers/xml-parser.js';
import { serializeYaml } from '../serializers/yaml-serializer.js';
import type { XmlParseOptions } from '../types/xml.js';
import type { YamlSerializeOptions } from '../types/yaml.js';
import { InvalidInputError } from '../errors/index.js';

export interface XmlToYamlOptions extends YamlSerializeOptions {
  /** XML parsing options */
  xmlOptions?: XmlParseOptions;
}

/**
 * Convert XML string into a YAML formatted string
 */
export function xmlToYaml(
  xml: string,
  options: XmlToYamlOptions = {}
): string {
  if (typeof xml !== 'string') {
    throw new InvalidInputError('Input must be a string');
  }

  const trimmed = xml.trim();
  if (!trimmed) {
    return '{}\n';
  }

  const parsed = parseXml(xml, options.xmlOptions);
  return serializeYaml(parsed as unknown as import('../types/common.js').JsonValue, options);
}
