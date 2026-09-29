/**
 * Plain Text to HTML Converter
 */

import { escapeHtml } from '../internal/escaping.js';
import { InvalidInputError } from '../errors/index.js';

export interface TextToHtmlOptions {
  /** If true, converts single linebreaks inside paragraphs into <br>. Defaults to true */
  preserveLineBreaks?: boolean;
}

/**
 * Convert plain text into HTML paragraphs
 */
export function textToHtml(
  text: string,
  options: TextToHtmlOptions = {}
): string {
  if (typeof text !== 'string') {
    throw new InvalidInputError('Input must be a string');
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return '';
  }

  const preserveBreaks = options.preserveLineBreaks !== false;

  // Split into paragraphs by two or more newlines
  const paragraphs = text.split(/\r?\n\s*\r?\n/);
  const htmlParagraphs: string[] = [];

  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;

    const escaped = escapeHtml(trimmedPara);
    if (preserveBreaks) {
      const withBreaks = escaped.replace(/\r?\n/g, '<br />\n');
      htmlParagraphs.push(`<p>${withBreaks}</p>`);
    } else {
      const normalized = escaped.replace(/\s+/g, ' ');
      htmlParagraphs.push(`<p>${normalized}</p>`);
    }
  }

  return htmlParagraphs.join('\n');
}
