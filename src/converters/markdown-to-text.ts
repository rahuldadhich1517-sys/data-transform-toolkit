/**
 * Markdown to Plain Text Converter
 */

import { marked } from 'marked';
import { InvalidInputError } from '../errors/index.js';

export interface MarkdownToTextOptions {
  /** If true, formats links as 'Link Text (url)'. Defaults to false */
  preserveUrls?: boolean;
}

/**
 * Strip Markdown formatting into clean plain text
 */
export function markdownToText(
  markdown: string,
  options: MarkdownToTextOptions = {}
): string {
  if (typeof markdown !== 'string') {
    throw new InvalidInputError('Input must be a string');
  }

  const trimmed = markdown.trim();
  if (!trimmed) {
    return '';
  }

  const tokens = marked.lexer(markdown);
  const out: string[] = [];

  for (const token of tokens) {
    switch (token.type) {
      case 'heading': {
        out.push(stripInlineMd(token.text, options.preserveUrls));
        break;
      }

      case 'paragraph': {
        out.push(stripInlineMd(token.text, options.preserveUrls));
        break;
      }

      case 'code': {
        out.push(token.text);
        break;
      }

      case 'blockquote': {
        const text = token.text
          .split('\n')
          .map(l => stripInlineMd(l, options.preserveUrls))
          .join('\n');
        out.push(text);
        break;
      }

      case 'list': {
        const items: string[] = [];
        for (let i = 0; i < token.items.length; i++) {
          const item = token.items[i]!;
          const prefix = token.ordered ? `${i + 1}. ` : '• ';
          items.push(`${prefix}${stripInlineMd(item.text, options.preserveUrls)}`);
        }
        out.push(items.join('\n'));
        break;
      }

      case 'table': {
        const header = token.header.map(c => stripInlineMd(c.text, options.preserveUrls)).join(' | ');
        const rows = token.rows.map(r => r.map(c => stripInlineMd(c.text, options.preserveUrls)).join(' | '));
        out.push([header, ...rows].join('\n'));
        break;
      }
    }
  }

  return out.join('\n\n').trim();
}

function stripInlineMd(text: string, preserveUrls = false): string {
  let result = text;

  // Images
  result = result.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');

  // Links
  if (preserveUrls) {
    result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');
  } else {
    result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');
  }

  // Bold & Italic & Strikethrough
  result = result.replace(/(\*\*|__)(.*?)\1/g, '$2');
  result = result.replace(/(\*|_)(.*?)\1/g, '$2');
  result = result.replace(/~~(.*?)~~/g, '$1');

  // Inline code
  result = result.replace(/`([^`]+)`/g, '$1');

  // Strip raw HTML tags
  result = result.replace(/<[^>]+>/g, '');

  return result.trim();
}
