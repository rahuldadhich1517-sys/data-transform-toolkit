/**
 * XML to JSON Converter
 */

import type { XmlParseOptions } from '../types/xml.js';
import { parseXml } from '../parsers/xml-parser.js';

export interface XmlToJsonOptions extends XmlParseOptions {
  // Additional options can be added here
}

/**
 * Convert XML string to JSON
 * @param xml XML formatted string
 * @param options Conversion options
 * @returns Parsed XML as JSON object
 */
export function xmlToJson(xml: string, options?: XmlToJsonOptions): Record<string, unknown> {
  return parseXml(xml, options);
}
