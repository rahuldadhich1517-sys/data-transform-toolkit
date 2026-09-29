/**
 * Apple XML Property List (plist) to JSON Converter
 */

import { tokenizeHtml, type HtmlToken } from '../internal/html-parser.js';
import { unescapeHtml } from '../internal/escaping.js';
import { InvalidInputError } from '../errors/index.js';

export interface PlistToJsonOptions {
  /** If true, return decoded UTF-8 string for <data> elements if valid UTF-8, else base64. Defaults to false (keeps base64) */
  decodeData?: boolean;
}

/**
 * Convert Apple XML Property List (.plist) string into a JSON object/value
 */
export function plistToJson(
  plistXml: string,
  options: PlistToJsonOptions = {}
): unknown {
  if (typeof plistXml !== 'string') {
    throw new InvalidInputError('Input must be a string');
  }

  const trimmed = plistXml.trim();
  if (!trimmed) {
    return null;
  }

  // Check for binary plist header
  if (trimmed.startsWith('bplist')) {
    throw new InvalidInputError('Binary plist format is not supported. Please convert to XML plist first.');
  }

  const tokens = tokenizeHtml(plistXml);
  let i = 0;

  // Find root <plist> opening tag
  while (i < tokens.length && (tokens[i]!.type !== 'tag_open' || tokens[i]!.name !== 'plist')) {
    i++;
  }

  if (i >= tokens.length) {
    throw new InvalidInputError('No <plist> root element found');
  }

  i++; // Step inside <plist>

  // Skip any whitespace tokens to find top value (<dict> or <array> or scalar)
  while (i < tokens.length && tokens[i]!.type === 'text' && !tokens[i]!.content?.trim()) {
    i++;
  }

  if (i >= tokens.length || tokens[i]!.type === 'tag_close') {
    return null;
  }

  const { value } = parsePlistValue(tokens, i, options);
  return value;
}

function parsePlistValue(
  tokens: HtmlToken[],
  startIndex: number,
  options: PlistToJsonOptions
): { value: unknown; nextIndex: number } {
  let i = startIndex;

  while (i < tokens.length && tokens[i]!.type === 'text' && !tokens[i]!.content?.trim()) {
    i++;
  }

  if (i >= tokens.length) {
    return { value: null, nextIndex: i };
  }

  const token = tokens[i]!;

  // Handle boolean self-closing tags: <true/>, <false/>
  if (token.type === 'tag_self_closing') {
    if (token.name === 'true') return { value: true, nextIndex: i + 1 };
    if (token.name === 'false') return { value: false, nextIndex: i + 1 };
    if (token.name === 'string') return { value: '', nextIndex: i + 1 };
    if (token.name === 'data') return { value: '', nextIndex: i + 1 };
    if (token.name === 'date') return { value: '', nextIndex: i + 1 };
    if (token.name === 'integer') return { value: 0, nextIndex: i + 1 };
    if (token.name === 'real') return { value: 0, nextIndex: i + 1 };
    return { value: null, nextIndex: i + 1 };
  }

  if (token.type !== 'tag_open') {
    return { value: null, nextIndex: i + 1 };
  }

  const tag = token.name;
  i++; // Move past opening tag

  if (tag === 'dict') {
    const dict: Record<string, unknown> = {};
    let currentKey: string | null = null;

    while (i < tokens.length) {
      // Check for </dict>
      if (tokens[i]!.type === 'tag_close' && tokens[i]!.name === 'dict') {
        i++;
        return { value: dict, nextIndex: i };
      }

      // Check for <key>
      if (tokens[i]!.type === 'tag_open' && tokens[i]!.name === 'key') {
        i++;
        let keyText = '';
        while (i < tokens.length && !(tokens[i]!.type === 'tag_close' && tokens[i]!.name === 'key')) {
          if (tokens[i]!.type === 'text') keyText += tokens[i]!.content;
          i++;
        }
        if (i < tokens.length) i++; // skip </key>
        currentKey = unescapeHtml(keyText.trim());

        // Now parse value for this key
        const { value: val, nextIndex: nextI } = parsePlistValue(tokens, i, options);
        dict[currentKey] = val;
        i = nextI;
        continue;
      }

      i++;
    }

    return { value: dict, nextIndex: i };
  }

  if (tag === 'array') {
    const arr: unknown[] = [];

    while (i < tokens.length) {
      if (tokens[i]!.type === 'tag_close' && tokens[i]!.name === 'array') {
        i++;
        return { value: arr, nextIndex: i };
      }

      if (tokens[i]!.type === 'tag_open' || tokens[i]!.type === 'tag_self_closing') {
        const { value: val, nextIndex: nextI } = parsePlistValue(tokens, i, options);
        arr.push(val);
        i = nextI;
        continue;
      }

      i++;
    }

    return { value: arr, nextIndex: i };
  }

  // Primitive elements: <string>, <integer>, <real>, <date>, <data>, <true>, <false>
  let text = '';
  while (i < tokens.length && !(tokens[i]!.type === 'tag_close' && tokens[i]!.name === tag)) {
    if (tokens[i]!.type === 'text') {
      text += tokens[i]!.content;
    }
    i++;
  }
  if (i < tokens.length) i++; // skip closing tag

  const trimmedText = text.trim();

  switch (tag) {
    case 'string':
      return { value: unescapeHtml(trimmedText), nextIndex: i };
    case 'integer':
      return { value: parseInt(trimmedText, 10) || 0, nextIndex: i };
    case 'real':
      return { value: parseFloat(trimmedText) || 0, nextIndex: i };
    case 'true':
      return { value: true, nextIndex: i };
    case 'false':
      return { value: false, nextIndex: i };
    case 'date':
      return { value: trimmedText, nextIndex: i };
    case 'data': {
      const cleanData = trimmedText.replace(/\s+/g, '');
      if (options.decodeData) {
        try {
          const buf = Buffer.from(cleanData, 'base64');
          return { value: buf.toString('utf-8'), nextIndex: i };
        } catch {
          return { value: cleanData, nextIndex: i };
        }
      }
      return { value: cleanData, nextIndex: i };
    }
    default:
      return { value: unescapeHtml(trimmedText), nextIndex: i };
  }
}
