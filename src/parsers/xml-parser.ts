/**
 * XML Parser - Converts XML to JSON format
 */

import type { XmlParseOptions } from '../types/xml.js';
import { XmlParseError } from '../errors/index.js';

interface Token {
  type: 'opening' | 'closing' | 'text' | 'selfClosing' | 'comment' | 'cdata';
  name?: string;
  attributes?: Record<string, string>;
  content?: string;
  position: number;
}

interface ParsedElement {
  name: string;
  attributes: Record<string, string>;
  children: (ParsedElement | string)[];
  text: string;
}

export class XmlParser {
  private readonly maxDepth: number;
  private readonly maxStringLength: number;
  private readonly parseCdata: boolean;
  private readonly parseComments: boolean;
  private readonly parseNumbers: boolean;
  private readonly attributePrefix: string;
  private readonly textContentKey: string;
  private readonly strict: boolean;
  private depth = 0;

  constructor(options: XmlParseOptions = {}) {
    this.maxDepth = options.maxDepth ?? 100;
    this.maxStringLength = options.maxStringLength ?? 1048576;
    this.parseCdata = options.parseCdata !== false;
    this.parseComments = options.parseComments !== false;
    this.parseNumbers = options.parseNumbers !== false;
    this.attributePrefix = options.attributePrefix ?? '@';
    this.textContentKey = options.textContentKey ?? '#text';
    this.strict = options.strict ?? false;
  }

  public parse(xml: string): Record<string, unknown> {
    if (typeof xml !== 'string') {
      throw new XmlParseError('Input must be a string', { context: { type: typeof xml } });
    }

    const trimmed = xml.trim();
    if (trimmed === '') {
      return {};
    }

    // Remove XML declaration
    let content = trimmed.replace(/^<\?[^?]*\?>/, '').trim();

    // Tokenize
    const tokens = this.tokenize(content);

    if (tokens.length === 0) {
      return {};
    }

    // Find root element
    let rootToken: Token | null = null;
    for (const token of tokens) {
      if (token.type === 'opening' || token.type === 'selfClosing') {
        rootToken = token;
        break;
      }
    }

    if (!rootToken) {
      throw new XmlParseError('No root element found', { context: { tokens: tokens.length } });
    }

    const element = this.parseElement(tokens, 0, rootToken.name!);
    const result: Record<string, unknown> = {};
    result[rootToken.name!] = this.elementToJson(element);

    return result;
  }

  private tokenize(xml: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;

    while (i < xml.length) {
      if (xml[i] !== '<') {
        // Text content
        const end = xml.indexOf('<', i);
        const text = xml.substring(i, end === -1 ? xml.length : end).trim();
        if (text) {
          if (text.length > this.maxStringLength) {
            throw new XmlParseError('Text exceeds maximum length', {
              position: i,
              context: { maxLength: this.maxStringLength }
            });
          }
          tokens.push({
            type: 'text',
            content: this.unescapeXml(text),
            position: i
          });
        }
        i = end === -1 ? xml.length : end;
      } else if (xml.startsWith('<?', i)) {
        // XML declaration or processing instruction
        const end = xml.indexOf('?>', i);
        i = end === -1 ? xml.length : end + 2;
      } else if (xml.startsWith('<!--', i)) {
        // Comment
        const end = xml.indexOf('-->', i);
        if (end === -1) {
          throw new XmlParseError('Unclosed comment', { position: i });
        }
        const content = xml.substring(i + 4, end);
        if (this.parseComments) {
          tokens.push({
            type: 'comment',
            content,
            position: i
          });
        }
        i = end + 3;
      } else if (xml.startsWith('<![CDATA[', i)) {
        // CDATA section
        const end = xml.indexOf(']]>', i);
        if (end === -1) {
          throw new XmlParseError('Unclosed CDATA section', { position: i });
        }
        const content = xml.substring(i + 9, end);
        if (this.parseCdata) {
          tokens.push({
            type: 'cdata',
            content,
            position: i
          });
        }
        i = end + 3;
      } else if (xml.startsWith('</', i)) {
        // Closing tag
        const end = xml.indexOf('>', i);
        if (end === -1) {
          throw new XmlParseError('Unclosed tag', { position: i });
        }
        const name = xml.substring(i + 2, end).trim();
        tokens.push({
          type: 'closing',
          name,
          position: i
        });
        i = end + 1;
      } else if (xml[i] === '<') {
        // Opening or self-closing tag
        const end = xml.indexOf('>', i);
        if (end === -1) {
          throw new XmlParseError('Unclosed tag', { position: i });
        }

        const tagContent = xml.substring(i + 1, end);
        const isSelfClosing = tagContent.endsWith('/');
        const cleanContent = isSelfClosing ? tagContent.substring(0, tagContent.length - 1) : tagContent;

        const spaceIndex = cleanContent.search(/\s/);
        const name = spaceIndex === -1 ? cleanContent : cleanContent.substring(0, spaceIndex);
        const attrsStr = spaceIndex === -1 ? '' : cleanContent.substring(spaceIndex).trim();

        if (!name) {
          throw new XmlParseError('Empty tag name', { position: i });
        }

        const attributes = this.parseAttributes(attrsStr);

        tokens.push({
          type: isSelfClosing ? 'selfClosing' : 'opening',
          name,
          attributes,
          position: i
        });

        i = end + 1;
      } else {
        i++;
      }
    }

    return tokens;
  }

  private parseAttributes(attrStr: string): Record<string, string> {
    const attributes: Record<string, string> = {};
    const attrRegex = /(\w+)="([^"]*)"|(\w+)='([^']*)'/g;
    let match;

    while ((match = attrRegex.exec(attrStr)) !== null) {
      const name = match[1] || match[3];
      const value = match[2] || match[4];
      attributes[name] = this.unescapeXml(value);
    }

    return attributes;
  }

  private parseElement(
    tokens: Token[],
    startIndex: number,
    expectedName: string
  ): ParsedElement {
    if (this.depth >= this.maxDepth) {
      throw new XmlParseError('Maximum nesting depth exceeded', {
        context: { maxDepth: this.maxDepth }
      });
    }

    const element: ParsedElement = {
      name: expectedName,
      attributes: {},
      children: [],
      text: ''
    };

    let i = startIndex;

    // Find opening tag
    while (i < tokens.length) {
      const token = tokens[i];

      if (token.type === 'opening' && token.name === expectedName) {
        element.attributes = token.attributes || {};
        i++;
        break;
      } else if (token.type === 'selfClosing' && token.name === expectedName) {
        element.attributes = token.attributes || {};
        return element;
      }

      i++;
    }

    this.depth++;
    let closed = false;

    // Parse children
    while (i < tokens.length) {
      const token = tokens[i]!;

      if (token.type === 'closing') {
        if (token.name === expectedName) {
          closed = true;
          i++;
          break;
        } else if (this.strict) {
          throw new XmlParseError(`Mismatched closing tag: expected </${expectedName}>, found </${token.name}>`, {
            position: token.position
          });
        }
      } else if (token.type === 'text' && token.content) {
        element.children.push(token.content);
        element.text += token.content;
      } else if ((token.type === 'opening' || token.type === 'selfClosing') && token.name) {
        const child = this.parseElement(tokens, i, token.name);
        element.children.push(child);
        // Skip to after the closing tag
        let depth = 1;
        i++;
        while (i < tokens.length && depth > 0) {
          if ((tokens[i]!.type === 'opening' || tokens[i]!.type === 'selfClosing') && tokens[i]!.name === token.name) {
            depth++;
          } else if (tokens[i]!.type === 'closing' && tokens[i]!.name === token.name) {
            depth--;
          }
          i++;
        }
        continue;
      } else if (token.type === 'comment' || token.type === 'cdata') {
        if (token.content) {
          element.children.push(token.content);
          element.text += token.content;
        }
      }

      i++;
    }

    if (!closed && this.strict) {
      throw new XmlParseError(`Unclosed tag <${expectedName}>`);
    }

    this.depth--;

    return element;
  }

  private elementToJson(element: ParsedElement): unknown {
    // Group children by name to detect arrays
    const childrenByName: Record<string, unknown[]> = {};
    const result: Record<string, unknown> = {};

    for (const child of element.children) {
      if (typeof child === 'string') {
        if (!result[this.textContentKey]) {
          result[this.textContentKey] = child;
        }
      } else {
        const childName = child.name;
        if (!childrenByName[childName]) {
          childrenByName[childName] = [];
        }
        childrenByName[childName].push(this.elementToJson(child));
      }
    }

    // Merge children into result
    for (const [name, children] of Object.entries(childrenByName)) {
      if (children.length === 1) {
        result[name] = children[0];
      } else {
        result[name] = children;
      }
    }

    // Add attributes
    for (const [attrName, attrValue] of Object.entries(element.attributes)) {
      let val: unknown = attrValue;
      if (this.parseNumbers && typeof attrValue === 'string' && /^-?\d+(\.\d+)?$/.test(attrValue.trim())) {
        val = Number(attrValue.trim());
      }
      result[this.attributePrefix + attrName] = val;
    }

    // If only text content, return it (with optional number parsing)
    if (Object.keys(result).length === 0 || (Object.keys(result).length === 1 && this.textContentKey in result)) {
      const textValue = result[this.textContentKey] || '';
      
      // Parse as number if enabled and the string looks like a number
      if (this.parseNumbers && typeof textValue === 'string') {
        const trimmed = textValue.trim();
        if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
          return Number(trimmed);
        }
      }
      
      return textValue;
    }

    return result;
  }

  private unescapeXml(text: string): string {
    return text
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
  }
}

export function parseXml(xml: string, options?: XmlParseOptions): Record<string, unknown> {
  const parser = new XmlParser(options);
  return parser.parse(xml);
}
