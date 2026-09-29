/**
 * Safe, browser-independent HTML parser and formatting utilities
 */

import { HtmlParseError } from '../errors/index.js';
import { unescapeHtml } from './escaping.js';

export const VOID_HTML_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

export interface HtmlToken {
  type: 'tag_open' | 'tag_close' | 'tag_self_closing' | 'text' | 'comment' | 'doctype';
  name?: string;
  attrs?: Record<string, string>;
  rawAttrs?: string;
  content?: string;
  line: number;
  col: number;
}

/** Tokenize HTML string safely without DOM dependencies */
export function tokenizeHtml(html: string): HtmlToken[] {
  const tokens: HtmlToken[] = [];
  let i = 0;
  let line = 1;
  let col = 1;

  function updatePos(char: string) {
    if (char === '\n') {
      line++;
      col = 1;
    } else {
      col++;
    }
  }

  while (i < html.length) {
    if (html[i] === '<') {
      const curLine = line;
      const curCol = col;

      if (html.startsWith('<!--', i)) {
        // Comment
        const end = html.indexOf('-->', i);
        if (end === -1) {
          throw new HtmlParseError('Unclosed HTML comment', { line: curLine, column: curCol });
        }
        const comment = html.substring(i + 4, end);
        tokens.push({ type: 'comment', content: comment, line: curLine, col: curCol });
        for (let j = i; j < end + 3; j++) updatePos(html[j]!);
        i = end + 3;
      } else if (html.substring(i, i + 9).toLowerCase() === '<!doctype') {
        const end = html.indexOf('>', i);
        if (end === -1) {
          throw new HtmlParseError('Unclosed DOCTYPE', { line: curLine, column: curCol });
        }
        const dt = html.substring(i + 1, end).trim();
        tokens.push({ type: 'doctype', content: dt, line: curLine, col: curCol });
        for (let j = i; j <= end; j++) updatePos(html[j]!);
        i = end + 1;
      } else if (html.startsWith('</', i)) {
        // Closing tag
        const end = html.indexOf('>', i);
        if (end === -1) {
          throw new HtmlParseError('Unclosed HTML tag', { line: curLine, column: curCol });
        }
        const rawName = html.substring(i + 2, end).trim().toLowerCase();
        tokens.push({ type: 'tag_close', name: rawName, line: curLine, col: curCol });
        for (let j = i; j <= end; j++) updatePos(html[j]!);
        i = end + 1;
      } else {
        // Opening or self-closing tag
        const end = html.indexOf('>', i);
        if (end === -1) {
          throw new HtmlParseError('Unclosed HTML tag', { line: curLine, column: curCol });
        }
        let tagInner = html.substring(i + 1, end).trim();
        const isSelfClosing = tagInner.endsWith('/');
        if (isSelfClosing) {
          tagInner = tagInner.substring(0, tagInner.length - 1).trim();
        }

        const spaceIdx = tagInner.search(/\s/);
        const tagName = (spaceIdx === -1 ? tagInner : tagInner.substring(0, spaceIdx)).toLowerCase();
        const rawAttrs = spaceIdx === -1 ? '' : tagInner.substring(spaceIdx).trim();

        // Parse attributes
        const attrs: Record<string, string> = {};
        if (rawAttrs) {
          const attrRegex = /([a-zA-Z0-9_\-:@.]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
          let match: RegExpExecArray | null;
          while ((match = attrRegex.exec(rawAttrs)) !== null) {
            const attrName = match[1]!.toLowerCase();
            const attrVal = match[2] ?? match[3] ?? match[4] ?? '';
            attrs[attrName] = unescapeHtml(attrVal);
          }
        }

        const effectiveSelfClosing = isSelfClosing || VOID_HTML_TAGS.has(tagName);
        tokens.push({
          type: effectiveSelfClosing ? 'tag_self_closing' : 'tag_open',
          name: tagName,
          attrs,
          rawAttrs,
          line: curLine,
          col: curCol
        });

        // Skip raw script / style tag content
        if (tagName === 'script' || tagName === 'style') {
          const closeTag = `</${tagName}>`;
          const endScript = html.toLowerCase().indexOf(closeTag, end + 1);
          if (endScript !== -1) {
            for (let j = i; j <= end; j++) updatePos(html[j]!);
            const scriptContent = html.substring(end + 1, endScript);
            tokens.push({ type: 'text', content: scriptContent, line: line, col: col });
            for (let j = end + 1; j < endScript; j++) updatePos(html[j]!);
            tokens.push({ type: 'tag_close', name: tagName, line: line, col: col });
            for (let j = endScript; j < endScript + closeTag.length; j++) updatePos(html[j]!);
            i = endScript + closeTag.length;
            continue;
          }
        }

        for (let j = i; j <= end; j++) updatePos(html[j]!);
        i = end + 1;
      }
    } else {
      // Text
      const curLine = line;
      const curCol = col;
      const nextOpen = html.indexOf('<', i);
      const textEnd = nextOpen === -1 ? html.length : nextOpen;
      const text = html.substring(i, textEnd);
      for (let j = i; j < textEnd; j++) updatePos(html[j]!);
      tokens.push({ type: 'text', content: text, line: curLine, col: curCol });
      i = textEnd;
    }
  }

  return tokens;
}

/** Extract text inside an HTML string, stripping tags and entities */
export function stripHtmlToText(html: string, options: { preserveLinks?: boolean } = {}): string {
  // First remove script and style blocks
  let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  clean = clean.replace(/<!--[\s\S]*?-->/g, '');

  if (options.preserveLinks) {
    clean = clean.replace(/<a\b[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)');
  }

  // Replace block tags with newline breaks
  clean = clean.replace(/<\/(p|div|h[1-6]|li|tr|blockquote|table)>/gi, '\n');
  clean = clean.replace(/<(br|hr)\s*\/?>/gi, '\n');
  clean = clean.replace(/<li\b[^>]*>/gi, '• ');

  // Strip all remaining tags
  clean = clean.replace(/<[^>]+>/g, '');

  // Unescape entities
  clean = unescapeHtml(clean);

  // Normalize whitespace: collapse multiple blank lines
  const lines = clean.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  return lines.join('\n');
}
