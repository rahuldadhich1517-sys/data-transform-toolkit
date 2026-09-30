/**
 * XML Formatter
 * Formats and indents XML strings safely.
 */

import { parseXml } from '../parsers/xml-parser.js';
import { XmlParseError, InvalidInputError } from '../errors/index.js';

export interface XmlFormatOptions {
  /** Number of spaces for indentation. Defaults to 2 */
  indent?: number;
  /** Whether to keep the <?xml ...?> declaration. Defaults to true */
  preserveDeclaration?: boolean;
}

/**
 * Format and pretty-print XML with consistent indentation
 */
export function xmlFormat(
  xml: string,
  options: XmlFormatOptions = {}
): string {
  if (typeof xml !== 'string') {
    throw new InvalidInputError('Input must be a string');
  }

  const trimmed = xml.trim();
  if (!trimmed) {
    return '';
  }

  // First validate well-formedness by parsing
  parseXml(trimmed, { strict: true });

  const indentSize = options.indent ?? 2;
  const preserveDecl = options.preserveDeclaration !== false;

  // Extract declaration if present
  let content = trimmed;
  let declaration = '';
  const declMatch = content.match(/^<\?xml[^?]*\?>/i);
  if (declMatch) {
    declaration = declMatch[0];
    content = content.substring(declaration.length).trim();
  }

  const tokens = tokenizeXmlForFormatting(content);
  const lines: string[] = [];

  if (preserveDecl && declaration) {
    lines.push(declaration);
  }

  let depth = 0;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!;
    const pad = ' '.repeat(Math.max(0, depth * indentSize));

    switch (token.type) {
      case 'comment':
        lines.push(`${pad}<!--${token.content}-->`);
        break;

      case 'cdata':
        lines.push(`${pad}<![CDATA[${token.content}]]>`);
        break;

      case 'selfClosing':
        lines.push(`${pad}<${token.raw} />`);
        break;

      case 'opening': {
        // Check if next token is text and followed immediately by matching closing tag: <tag>text</tag>
        const next = tokens[i + 1];
        const nextNext = tokens[i + 2];
        if (
          next &&
          next.type === 'text' &&
          nextNext &&
          nextNext.type === 'closing' &&
          nextNext.name === token.name &&
          !next.content?.includes('\n')
        ) {
          lines.push(`${pad}<${token.raw}>${next.content}</${token.name}>`);
          i += 2; // skip text and closing
          break;
        }

        lines.push(`${pad}<${token.raw}>`);
        depth++;
        break;
      }

      case 'closing': {
        depth = Math.max(0, depth - 1);
        const closingPad = ' '.repeat(Math.max(0, depth * indentSize));
        lines.push(`${closingPad}</${token.name}>`);
        break;
      }

      case 'text': {
        const text = token.content?.trim();
        if (text) {
          lines.push(`${pad}${text}`);
        }
        break;
      }
    }
  }

  return lines.join('\n');
}

interface FormatToken {
  type: 'opening' | 'closing' | 'selfClosing' | 'text' | 'comment' | 'cdata';
  name?: string;
  raw?: string;
  content?: string;
}

function tokenizeXmlForFormatting(xml: string): FormatToken[] {
  const tokens: FormatToken[] = [];
  let i = 0;

  while (i < xml.length) {
    if (xml[i] !== '<') {
      const end = xml.indexOf('<', i);
      const text = xml.substring(i, end === -1 ? xml.length : end);
      const trimmedText = text.trim();
      if (trimmedText) {
        tokens.push({ type: 'text', content: trimmedText });
      }
      i = end === -1 ? xml.length : end;
    } else if (xml.startsWith('<!--', i)) {
      const end = xml.indexOf('-->', i);
      if (end === -1) {
        throw new XmlParseError('Unclosed comment');
      }
      tokens.push({ type: 'comment', content: xml.substring(i + 4, end) });
      i = end + 3;
    } else if (xml.startsWith('<![CDATA[', i)) {
      const end = xml.indexOf(']]>', i);
      if (end === -1) {
        throw new XmlParseError('Unclosed CDATA section');
      }
      tokens.push({ type: 'cdata', content: xml.substring(i + 9, end) });
      i = end + 3;
    } else if (xml.startsWith('</', i)) {
      const end = xml.indexOf('>', i);
      if (end === -1) {
        throw new XmlParseError('Unclosed tag');
      }
      const name = xml.substring(i + 2, end).trim();
      tokens.push({ type: 'closing', name });
      i = end + 1;
    } else if (xml[i] === '<') {
      const end = xml.indexOf('>', i);
      if (end === -1) {
        throw new XmlParseError('Unclosed tag');
      }
      const raw = xml.substring(i + 1, end).trim();
      const isSelfClosing = raw.endsWith('/');
      const cleanRaw = isSelfClosing ? raw.substring(0, raw.length - 1).trim() : raw;
      const spaceIdx = cleanRaw.search(/\s/);
      const name = spaceIdx === -1 ? cleanRaw : cleanRaw.substring(0, spaceIdx);

      tokens.push({
        type: isSelfClosing ? 'selfClosing' : 'opening',
        name,
        raw: cleanRaw
      });
      i = end + 1;
    } else {
      i++;
    }
  }

  return tokens;
}
