/**
 * Markdown to reStructuredText (RST) Converter
 */

import { marked } from 'marked';
import { InvalidInputError } from '../errors/index.js';

export interface MarkdownToRstOptions {
  /** Heading underline characters per depth (1 to 6) */
  headingChars?: string[];
}

const DEFAULT_HEADING_CHARS = ['=', '-', '~', '^', '"', "'"];

/**
 * Convert Markdown formatted text into reStructuredText (RST)
 */
export function markdownToRst(
  markdown: string,
  options: MarkdownToRstOptions = {}
): string {
  if (typeof markdown !== 'string') {
    throw new InvalidInputError('Input must be a string');
  }

  const trimmed = markdown.trim();
  if (!trimmed) {
    return '';
  }

  const headingChars = options.headingChars ?? DEFAULT_HEADING_CHARS;
  const tokens = marked.lexer(markdown);
  const out: string[] = [];

  for (const token of tokens) {
    switch (token.type) {
      case 'heading': {
        const title = convertInlineMdToRst(token.text);
        const char = headingChars[Math.min(token.depth - 1, headingChars.length - 1)] ?? '=';
        const underline = char.repeat(Math.max(title.length, 3));
        out.push(`${title}\n${underline}`);
        break;
      }

      case 'paragraph': {
        out.push(convertInlineMdToRst(token.text));
        break;
      }

      case 'code': {
        const lang = token.lang ? ` ${token.lang}` : '';
        const indentedCode = token.text.split('\n').map(l => `   ${l}`).join('\n');
        out.push(`.. code-block::${lang}\n\n${indentedCode}`);
        break;
      }

      case 'blockquote': {
        const quoteText = token.text.split('\n').map(l => `   ${convertInlineMdToRst(l)}`).join('\n');
        out.push(quoteText);
        break;
      }

      case 'list': {
        const items: string[] = [];
        for (let i = 0; i < token.items.length; i++) {
          const item = token.items[i]!;
          const prefix = token.ordered ? `${i + 1}. ` : '- ';
          const itemContent = convertInlineMdToRst(item.text);
          items.push(`${prefix}${itemContent}`);
        }
        out.push(items.join('\n'));
        break;
      }

      case 'hr':
        out.push('------------');
        break;

      case 'table': {
        // Simple RST grid table or CSV table directive
        const headerRow = token.header.map(c => convertInlineMdToRst(c.text));
        const dataRows = token.rows.map(r => r.map(c => convertInlineMdToRst(c.text)));

        const allRows = [headerRow, ...dataRows];
        const maxCols = headerRow.length;
        const colWidths = Array.from({ length: maxCols }, (_, c) =>
          Math.max(3, ...allRows.map(r => (r[c] ? r[c]!.length : 3)))
        );

        const border = '+' + colWidths.map(w => '-'.repeat(w + 2)).join('+') + '+';
        const headerBorder = '+' + colWidths.map(w => '='.repeat(w + 2)).join('+') + '+';

        const tableLines: string[] = [border];
        const hLine = '| ' + headerRow.map((h, i) => h.padEnd(colWidths[i]!)).join(' | ') + ' |';
        tableLines.push(hLine);
        tableLines.push(headerBorder);

        for (const row of dataRows) {
          const rLine = '| ' + row.map((cell, i) => (cell || '').padEnd(colWidths[i]!)).join(' | ') + ' |';
          tableLines.push(rLine);
          tableLines.push(border);
        }

        out.push(tableLines.join('\n'));
        break;
      }
    }
  }

  return out.join('\n\n').trim();
}

function convertInlineMdToRst(text: string): string {
  let result = text;

  // Inline code: `code` -> ``code``
  result = result.replace(/`([^`]+)`/g, '``$1``');

  // Bold: **bold** or __bold__ -> **bold**
  result = result.replace(/(\*\*|__)(.*?)\1/g, '**$2**');

  // Italic: *italic* or _italic_ -> *italic*
  result = result.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '*$1*');

  // Links: [Text](url) -> `Text <url>`_
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '`$1 <$2>`_');

  // Images: ![alt](url) -> .. image:: url
  result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '.. image:: $2');

  return result;
}
