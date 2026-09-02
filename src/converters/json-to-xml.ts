/**
 * JSON to XML Converter
 */

import type { XmlSerializeOptions } from '../types/xml.js';
import type { JsonValue } from '../types/common.js';
import { serializeXml } from '../serializers/xml-serializer.js';

export interface JsonToXmlOptions extends XmlSerializeOptions {
  // Additional options can be added here
}

/**
 * Convert JSON to XML format
 * @param data JSON value to convert
 * @param options Conversion options
 * @returns XML formatted string
 */
export function jsonToXml(data: JsonValue, options?: JsonToXmlOptions): string {
  return serializeXml(data, options);
}
