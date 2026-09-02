/**
 * XML Serializer - Converts JSON to XML format
 */

import type { XmlSerializeOptions, XmlElement, XmlNode } from '../types/xml.js';
import type { JsonValue, JsonObject } from '../types/common.js';
import { DataConversionError } from '../errors/index.js';

export class XmlSerializer {
  private readonly indentSize: number;
  private readonly rootElement: string;
  private readonly attributePrefix: string;
  private readonly textContentKey: string;
  private readonly lineEnding: string;
  private readonly selfClosing: boolean;
  private readonly xmlVersion: string;
  private readonly encoding: string;
  private readonly xmlDeclaration: boolean;
  private readonly maxDepth: number;
  private readonly maxStringLength: number;
  private depth = 0;

  constructor(options: XmlSerializeOptions = {}) {
    this.indentSize = options.indentSize ?? 2;
    this.rootElement = options.rootElement ?? 'root';
    this.attributePrefix = options.attributePrefix ?? '@';
    this.textContentKey = options.textContentKey ?? '#text';
    this.lineEnding = options.lineEnding ?? '\n';
    this.selfClosing = options.selfClosing !== false;
    this.xmlVersion = options.xmlVersion ?? '1.0';
    this.encoding = options.encoding ?? 'UTF-8';
    this.xmlDeclaration = options.xmlDeclaration !== false;
    this.maxDepth = options.maxDepth ?? 100;
    this.maxStringLength = options.maxStringLength ?? 1048576;
  }

  public serialize(data: JsonValue): string {
    const lines: string[] = [];

    if (this.xmlDeclaration) {
      lines.push(`<?xml version="${this.xmlVersion}" encoding="${this.encoding}"?>`);
    }

    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      const obj = data as JsonObject;
      const keys = Object.keys(obj);

      if (keys.length === 1) {
        // Use the single key as root
        const rootKey = keys[0];
        this.depth = 0;
        lines.push(this.serializeElement(rootKey, obj[rootKey]));
      } else if (keys.length === 0) {
        lines.push(`<${this.rootElement} />`);
      } else {
        // Multiple keys - wrap in root
        lines.push(`<${this.rootElement}>`);
        this.depth = 1;
        for (const key of keys) {
          lines.push(this.serializeElement(key, obj[key]));
        }
        lines.push(`</${this.rootElement}>`);
      }
    } else {
      lines.push(`<${this.rootElement}>`);
      lines.push(this.escapeXml(String(data)));
      lines.push(`</${this.rootElement}>`);
    }

    return lines.join(this.lineEnding);
  }

  private serializeElement(name: string, value: JsonValue, inline = false): string {
    if (this.depth >= this.maxDepth) {
      throw new DataConversionError('Maximum nesting depth exceeded', {
        to: 'XML',
        context: { maxDepth: this.maxDepth }
      });
    }

    const indent = ' '.repeat(this.indentSize * this.depth);
    name = this.sanitizeElementName(name);

    if (value === null || value === undefined) {
      if (this.selfClosing) {
        return inline ? `<${name} />` : `${indent}<${name} />`;
      }
      return inline ? `<${name}></${name}>` : `${indent}<${name}></${name}>`;
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      const text = this.escapeXml(String(value));
      if (inline) {
        return `<${name}>${text}</${name}>`;
      }
      return `${indent}<${name}>${text}</${name}>`;
    }

    if (Array.isArray(value)) {
      return this.serializeArray(name, value, inline);
    }

    if (typeof value === 'object') {
      return this.serializeObject(name, value as JsonObject, inline);
    }

    return inline ? `<${name} />` : `${indent}<${name} />`;
  }

  private serializeArray(name: string, arr: JsonValue[], inline = false): string {
    const indent = ' '.repeat(this.indentSize * this.depth);
    const lines: string[] = [];

    this.depth++;
    for (const item of arr) {
      lines.push(this.serializeElement(name, item, false));
    }
    this.depth--;

    return inline ? lines.join(this.lineEnding) : lines.join(this.lineEnding);
  }

  private serializeObject(name: string, obj: JsonObject, inline = false): string {
    const indent = ' '.repeat(this.indentSize * this.depth);
    const lines: string[] = [];

    // Separate attributes from content
    const attributes: Record<string, string> = {};
    const children: [string, JsonValue][] = [];

    for (const key of Object.keys(obj)) {
      if (key.startsWith(this.attributePrefix)) {
        const attrName = key.substring(this.attributePrefix.length);
        attributes[attrName] = String(obj[key]);
      } else if (key === this.textContentKey) {
        // Will be handled separately
      } else {
        children.push([key, obj[key]]);
      }
    }

    const attrString = this.buildAttributeString(attributes);
    const hasTextContent = this.textContentKey in obj;
    const textContent = hasTextContent ? obj[this.textContentKey] : null;

    if (children.length === 0 && !hasTextContent) {
      // Self-closing or empty tag
      if (this.selfClosing) {
        return inline
          ? `<${name}${attrString} />`
          : `${indent}<${name}${attrString} />`;
      }
      return inline
        ? `<${name}${attrString}></${name}>`
        : `${indent}<${name}${attrString}></${name}>`;
    }

    if (children.length === 0 && hasTextContent) {
      // Only text content
      const text = this.escapeXml(String(textContent));
      return inline
        ? `<${name}${attrString}>${text}</${name}>`
        : `${indent}<${name}${attrString}>${text}</${name}>`;
    }

    // Has child elements
    if (inline) {
      lines.push(`<${name}${attrString}>`);
    } else {
      lines.push(`${indent}<${name}${attrString}>`);
    }

    if (hasTextContent) {
      const text = this.escapeXml(String(textContent));
      lines.push(` `.repeat(this.indentSize * (this.depth + 1)) + text);
    }

    this.depth++;
    for (const [childName, childValue] of children) {
      lines.push(this.serializeElement(childName, childValue, false));
    }
    this.depth--;

    if (inline) {
      lines.push(`</${name}>`);
    } else {
      lines.push(`${indent}</${name}>`);
    }

    return lines.join(this.lineEnding);
  }

  private buildAttributeString(attributes: Record<string, string>): string {
    if (Object.keys(attributes).length === 0) {
      return '';
    }

    return (
      ' ' +
      Object.entries(attributes)
        .map(([key, value]) => `${key}="${this.escapeAttributeValue(value)}"`)
        .join(' ')
    );
  }

  private sanitizeElementName(name: string): string {
    // Ensure valid XML element name
    if (!/^[a-zA-Z_:][a-zA-Z0-9_:.\-]*$/.test(name)) {
      throw new DataConversionError('Invalid XML element name', {
        to: 'XML',
        context: { name }
      });
    }
    return name;
  }

  private escapeXml(text: string): string {
    if (text.length > this.maxStringLength) {
      throw new DataConversionError('String exceeds maximum length', {
        to: 'XML',
        context: { maxLength: this.maxStringLength }
      });
    }

    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private escapeAttributeValue(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

export function serializeXml(data: JsonValue, options?: XmlSerializeOptions): string {
  const serializer = new XmlSerializer(options);
  return serializer.serialize(data);
}
