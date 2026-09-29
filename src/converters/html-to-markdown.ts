/**
 * HTML to Markdown Converter
 */

import { tokenizeHtml, type HtmlToken } from '../internal/html-parser.js';
import { unescapeHtml } from '../internal/escaping.js';
import { InvalidInputError } from '../errors/index.js';

export interface HtmlToMarkdownOptions {
  /** If true, ignore image tags */
  ignoreImages?: boolean;
}

/**
 * Convert HTML string into Markdown format
 */
export function htmlToMarkdown(
  html: string,
  options: HtmlToMarkdownOptions = {}
): string {
  if (typeof html !== 'string') {
    throw new InvalidInputError('Input must be a string');
  }

  const trimmed = html.trim();
  if (!trimmed) {
    return '';
  }

  // First handle tables if present
  let processedHtml = html;
  processedHtml = convertHtmlTablesToMarkdown(processedHtml);

  const tokens = tokenizeHtml(processedHtml);
  let output = '';
  const tagStack: { name: string; attrs?: Record<string, string> }[] = [];
  let listIndex = 0;
  let inPre = false;

  for (const token of tokens) {
    if (token.type === 'tag_open') {
      const tag = token.name!;
      tagStack.push({ name: tag, attrs: token.attrs });

      switch (tag) {
        case 'h1': output += '\n\n# '; break;
        case 'h2': output += '\n\n## '; break;
        case 'h3': output += '\n\n### '; break;
        case 'h4': output += '\n\n#### '; break;
        case 'h5': output += '\n\n##### '; break;
        case 'h6': output += '\n\n###### '; break;
        case 'p': output += '\n\n'; break;
        case 'b':
        case 'strong': output += '**'; break;
        case 'i':
        case 'em': output += '*'; break;
        case 'code':
          if (!inPre) output += '`';
          break;
        case 'pre':
          inPre = true;
          output += '\n\n```\n';
          break;
        case 'blockquote': output += '\n\n> '; break;
        case 'ul': listIndex = 0; output += '\n'; break;
        case 'ol': listIndex = 1; output += '\n'; break;
        case 'li':
          if (listIndex > 0) {
            output += `\n${listIndex++}. `;
          } else {
            output += '\n- ';
          }
          break;
        case 'a':
          output += '[';
          break;
      }
    } else if (token.type === 'tag_close') {
      const tag = token.name!;
      const openTag = tagStack.pop();

      switch (tag) {
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
        case 'p':
          output += '\n';
          break;
        case 'b':
        case 'strong': output += '**'; break;
        case 'i':
        case 'em': output += '*'; break;
        case 'code':
          if (!inPre) output += '`';
          break;
        case 'pre':
          inPre = false;
          output += '\n```\n';
          break;
        case 'blockquote': output += '\n'; break;
        case 'ul':
        case 'ol':
          listIndex = 0;
          output += '\n';
          break;
        case 'a': {
          const href = openTag?.attrs?.href || '';
          output += `](${href})`;
          break;
        }
      }
    } else if (token.type === 'tag_self_closing') {
      const tag = token.name!;
      switch (tag) {
        case 'br': output += '  \n'; break;
        case 'hr': output += '\n\n---\n\n'; break;
        case 'img': {
          if (!options.ignoreImages) {
            const alt = token.attrs?.alt || '';
            const src = token.attrs?.src || '';
            output += `![${alt}](${src})`;
          }
          break;
        }
      }
    } else if (token.type === 'text') {
      if (inPre) {
        output += token.content;
      } else {
        output += unescapeHtml(token.content || '');
      }
    }
  }

  // Clean up excess newlines
  return output
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function convertHtmlTablesToMarkdown(html: string): string {
  const tableRegex = /<table\b[^>]*>([\s\S]*?)<\/table>/gi;
  return html.replace(tableRegex, (match) => {
    // Extract rows
    const rowRegex = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
    const rows: string[][] = [];
    let rowMatch: RegExpExecArray | null;

    while ((rowMatch = rowRegex.exec(match)) !== null) {
      const cellRegex = /<(?:td|th)\b[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;
      const cells: string[] = [];
      let cellMatch: RegExpExecArray | null;
      while ((cellMatch = cellRegex.exec(rowMatch[1]!)) !== null) {
        const text = cellMatch[1]!.replace(/<[^>]+>/g, '').trim();
        cells.push(unescapeHtml(text).replace(/\|/g, '\\|'));
      }
      if (cells.length > 0) {
        rows.push(cells);
      }
    }

    if (rows.length === 0) return '';

    const maxCols = Math.max(...rows.map(r => r.length));
    const headerRow = rows[0]!;
    while (headerRow.length < maxCols) headerRow.push('');

    const lines: string[] = [];
    lines.push('\n\n| ' + headerRow.join(' | ') + ' |');
    lines.push('| ' + Array.from({ length: maxCols }, () => '---').join(' | ') + ' |');

    for (let r = 1; r < rows.length; r++) {
      const dataRow = rows[r]!;
      while (dataRow.length < maxCols) dataRow.push('');
      lines.push('| ' + dataRow.join(' | ') + ' |');
    }
    lines.push('\n');

    return lines.join('\n');
  });
}
