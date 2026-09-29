/**
 * HTML Formatter / Pretty Printer
 */

import { tokenizeHtml, VOID_HTML_TAGS, type HtmlToken } from '../internal/html-parser.js';
import { HtmlParseError, InvalidInputError } from '../errors/index.js';

export interface HtmlFormatterOptions {
  /** Number of spaces for indentation. Defaults to 2 */
  indent?: number;
  /** Whether to enforce strict tag matching. Defaults to false */
  strict?: boolean;
}

/**
 * Format and indent HTML string
 */
export function htmlFormatter(
  html: string,
  options: HtmlFormatterOptions = {}
): string {
  if (typeof html !== 'string') {
    throw new InvalidInputError('Input must be a string');
  }

  const trimmed = html.trim();
  if (!trimmed) {
    return '';
  }

  const tokens = tokenizeHtml(html);
  const indentSize = options.indent ?? 2;
  const strict = options.strict ?? false;

  const lines: string[] = [];
  let depth = 0;
  const tagStack: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!;
    const pad = ' '.repeat(Math.max(0, depth * indentSize));

    switch (token.type) {
      case 'doctype':
        lines.push(`<!${token.content}>`);
        break;

      case 'comment':
        lines.push(`${pad}<!--${token.content}-->`);
        break;

      case 'tag_self_closing': {
        const attrStr = token.rawAttrs ? ` ${token.rawAttrs}` : '';
        const isVoid = VOID_HTML_TAGS.has(token.name!);
        const close = isVoid ? '>' : ' />';
        lines.push(`${pad}<${token.name}${attrStr}${close}`);
        break;
      }

      case 'tag_open': {
        const tag = token.name!;
        const attrStr = token.rawAttrs ? ` ${token.rawAttrs}` : '';

        // Check if inline content: <p>Text</p> on one line
        const next = tokens[i + 1];
        const nextNext = tokens[i + 2];
        if (
          next &&
          next.type === 'text' &&
          nextNext &&
          nextNext.type === 'tag_close' &&
          nextNext.name === tag &&
          !next.content?.includes('\n')
        ) {
          const innerText = next.content?.trim() || '';
          lines.push(`${pad}<${tag}${attrStr}>${innerText}</${tag}>`);
          i += 2; // skip text and close
          break;
        }

        lines.push(`${pad}<${tag}${attrStr}>`);
        tagStack.push(tag);
        depth++;
        break;
      }

      case 'tag_close': {
        const tag = token.name!;
        if (tagStack.length > 0 && tagStack[tagStack.length - 1] === tag) {
          tagStack.pop();
          depth = Math.max(0, depth - 1);
        } else if (strict) {
          throw new HtmlParseError(`Unmatched closing tag </${tag}>`, { line: token.line, column: token.col });
        } else {
          depth = Math.max(0, depth - 1);
        }
        const closingPad = ' '.repeat(Math.max(0, depth * indentSize));
        lines.push(`${closingPad}</${tag}>`);
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

  if (strict && tagStack.length > 0) {
    throw new HtmlParseError(`Unclosed HTML tags: ${tagStack.join(', ')}`);
  }

  return lines.join('\n');
}
