/**
 * XML to JSON Parser
 * Parser-oriented interface reusing the toolkit's XML parser engine.
 */

import { parseXml } from '../parsers/xml-parser.js';
import type { XmlParseOptions } from '../types/xml.js';
import { InvalidInputError } from '../errors/index.js';

export interface XmlToJsonParserOptions extends XmlParseOptions {
  /** Prefix for attribute keys in result. Defaults to '@' */
  attributePrefix?: string;
  /** Key for text content when element has both attributes and text. Defaults to '#text' */
  textContentKey?: string;
  /** Whether to parse numeric strings into numbers. Defaults to true */
  parseNumbers?: boolean;
}

/**
 * Parse an XML string into a structured JavaScript/JSON object
 */
export function xmlToJsonParser(
  xml: string,
  options: XmlToJsonParserOptions = {}
): Record<string, unknown> {
  if (typeof xml !== 'string') {
    throw new InvalidInputError('Input must be a string');
  }

  return parseXml(xml, options);
}
