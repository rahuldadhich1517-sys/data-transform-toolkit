/**
 * HTML to Plain Text Converter
 */

import { stripHtmlToText } from '../internal/html-parser.js';
import { InvalidInputError } from '../errors/index.js';

export interface HtmlToTextOptions {
  /** If true, formats links as 'Link Text (https://example.com)'. Defaults to false */
  preserveLinks?: boolean;
}

/**
 * Strip HTML into clean, readable plain text
 */
export function htmlToText(
  html: string,
  options: HtmlToTextOptions = {}
): string {
  if (typeof html !== 'string') {
    throw new InvalidInputError('Input must be a string');
  }

  return stripHtmlToText(html, { preserveLinks: options.preserveLinks });
}
