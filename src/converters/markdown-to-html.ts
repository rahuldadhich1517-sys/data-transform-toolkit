/**
 * Markdown to HTML Converter
 */

import { renderMarkdownToHtml } from '../internal/markdown.js';
import { InvalidInputError } from '../errors/index.js';

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

  return renderMarkdownToHtml(markdown, options).trim();
}
