/**
 * Markdown to HTML Converter
 */

import { marked } from 'marked';
import { InvalidInputError } from '../errors/index.js';
import { escapeHtml } from '../internal/escaping.js';

export interface MarkdownToHtmlOptions {
  /** If true, allows raw HTML inside Markdown. Defaults to false for security (raw HTML is escaped) */
  allowRawHtml?: boolean;
  /** If true, add <br> on single line breaks (GFM line breaks). Defaults to false */
  breaks?: boolean;
  /** If true, enable GitHub Flavored Markdown features. Defaults to true */
  gfm?: boolean;
}

/**
 * Render Markdown as HTML string
 */
export function markdownToHtml(
  markdown: string,
  options: MarkdownToHtmlOptions = {}
): string {
  if (typeof markdown !== 'string') {
    throw new InvalidInputError('Input must be a string');
  }

  const trimmed = markdown.trim();
  if (!trimmed) {
    return '';
  }

  let input = markdown;
  if (!options.allowRawHtml) {
    // Escape raw HTML tags while preserving Markdown structure
    input = input.replace(/<([^>]+)>/g, (match) => {
      // Don't escape autolinks <http://... > or <email@... >
      if (/^<https?:\/\/[^>]+>$/i.test(match) || /^<[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}>$/.test(match)) {
        return match;
      }
      return escapeHtml(match);
    });
  }

  const result = marked.parse(input, {
    gfm: options.gfm !== false,
    breaks: options.breaks ?? false,
    async: false
  });

  return (typeof result === 'string' ? result : '').trim();
}
