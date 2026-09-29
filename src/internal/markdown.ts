/**
 * Zero-dependency Markdown lexer and HTML renderer
 */

import { escapeHtml } from './escaping.js';

export type MarkdownToken =
  | { type: 'heading'; depth: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'code'; lang?: string; text: string }
  | { type: 'blockquote'; text: string }
  | { type: 'list'; ordered: boolean; items: Array<{ text: string }> }
  | { type: 'table'; header: Array<{ text: string }>; rows: Array<Array<{ text: string }>> }
  | { type: 'hr' };

export function tokenizeMarkdown(markdown: string): MarkdownToken[] {
  const tokens: MarkdownToken[] = [];
  const lines = markdown.split(/\r?\n/);
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i]!;
    const line = rawLine.trim();

    if (!line) {
      i++;
      continue;
    }

    // Fenced code block: ```lang
    if (line.startsWith('```') || line.startsWith('~~~')) {
      const fence = line.substring(0, 3);
      const lang = line.substring(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i]!.trim().startsWith(fence)) {
        codeLines.push(lines[i]!);
        i++;
      }
      if (i < lines.length) i++; // skip closing fence
      tokens.push({
        type: 'code',
        lang: lang || undefined,
        text: codeLines.join('\n')
      });
      continue;
    }

    // Horizontal rule: ---, ***, ___
    if (/^(?:-{3,}|\*{3,}|_{3,})$/.test(line)) {
      tokens.push({ type: 'hr' });
      i++;
      continue;
    }

    // Heading: # H1, ## H2, etc.
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      tokens.push({
        type: 'heading',
        depth: headingMatch[1]!.length,
        text: headingMatch[2]!.trim()
      });
      i++;
      continue;
    }

    // Blockquote: > text
    if (line.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && (lines[i]!.trim().startsWith('>') || (quoteLines.length > 0 && lines[i]!.trim()))) {
        const ql = lines[i]!.trim();
        if (ql.startsWith('>')) {
          quoteLines.push(ql.replace(/^>\s?/, ''));
        } else {
          quoteLines.push(ql);
        }
        i++;
      }
      tokens.push({
        type: 'blockquote',
        text: quoteLines.join('\n')
      });
      continue;
    }

    // Table: | col1 | col2 |
    if (line.startsWith('|') && line.endsWith('|')) {
      const nextLine = lines[i + 1]?.trim() || '';
      if (nextLine.startsWith('|') && nextLine.includes('---')) {
        // Table found
        const headerCells = parseTableRow(line);
        i += 2; // skip header and delimiter row
        const rows: Array<Array<{ text: string }>> = [];
        while (i < lines.length && lines[i]!.trim().startsWith('|') && lines[i]!.trim().endsWith('|')) {
          rows.push(parseTableRow(lines[i]!.trim()));
          i++;
        }
        tokens.push({
          type: 'table',
          header: headerCells,
          rows
        });
        continue;
      }
    }

    // List: unordered (- item, * item, + item) or ordered (1. item)
    const isUnordered = /^[-*+]\s+/.test(line);
    const isOrdered = /^\d+\.\s+/.test(line);
    if (isUnordered || isOrdered) {
      const items: Array<{ text: string }> = [];
      while (i < lines.length) {
        const itemLine = lines[i]!.trim();
        if (isUnordered && /^[-*+]\s+/.test(itemLine)) {
          items.push({ text: itemLine.replace(/^[-*+]\s+/, '') });
          i++;
        } else if (isOrdered && /^\d+\.\s+/.test(itemLine)) {
          items.push({ text: itemLine.replace(/^\d+\.\s+/, '') });
          i++;
        } else {
          break;
        }
      }
      tokens.push({
        type: 'list',
        ordered: isOrdered,
        items
      });
      continue;
    }

    // Paragraph
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i]!.trim() &&
      !lines[i]!.trim().startsWith('#') &&
      !lines[i]!.trim().startsWith('```') &&
      !lines[i]!.trim().startsWith('>') &&
      !lines[i]!.trim().startsWith('|') &&
      !/^[-*+]\s+/.test(lines[i]!.trim()) &&
      !/^\d+\.\s+/.test(lines[i]!.trim()) &&
      !/^(?:-{3,}|\*{3,}|_{3,})$/.test(lines[i]!.trim())
    ) {
      paraLines.push(lines[i]!.trim());
      i++;
    }

    tokens.push({
      type: 'paragraph',
      text: paraLines.join('\n')
    });
  }

  return tokens;
}

function parseTableRow(line: string): Array<{ text: string }> {
  const inner = line.substring(1, line.length - 1);
  return inner.split('|').map(c => ({ text: c.trim() }));
}

export interface RenderMarkdownOptions {
  allowRawHtml?: boolean;
  breaks?: boolean;
  gfm?: boolean;
}

/**
 * Render Markdown into clean, safe HTML
 */
export function renderMarkdownToHtml(markdown: string, options: RenderMarkdownOptions = {}): string {
  const trimmed = markdown.trim();
  if (!trimmed) return '';

  const tokens = tokenizeMarkdown(markdown);
  const out: string[] = [];

  for (const token of tokens) {
    switch (token.type) {
      case 'heading': {
        const hText = renderInline(token.text, options);
        out.push(`<h${token.depth}>${hText}</h${token.depth}>`);
        break;
      }
      case 'paragraph': {
        const pText = renderInline(token.text, options);
        out.push(`<p>${pText}</p>`);
        break;
      }
      case 'code': {
        const langClass = token.lang ? ` class="language-${escapeHtml(token.lang)}"` : '';
        out.push(`<pre><code${langClass}>${escapeHtml(token.text)}\n</code></pre>`);
        break;
      }
      case 'blockquote': {
        const bText = renderInline(token.text, options);
        out.push(`<blockquote>\n<p>${bText}</p>\n</blockquote>`);
        break;
      }
      case 'list': {
        const tag = token.ordered ? 'ol' : 'ul';
        const items = token.items
          .map(it => `<li>${renderInline(it.text, options)}</li>`)
          .join('\n');
        out.push(`<${tag}>\n${items}\n</${tag}>`);
        break;
      }
      case 'hr': {
        out.push('<hr>');
        break;
      }
      case 'table': {
        const hCells = token.header.map(c => `<th>${renderInline(c.text, options)}</th>`).join('');
        const rows = token.rows
          .map(r => `<tr>${r.map(c => `<td>${renderInline(c.text, options)}</td>`).join('')}</tr>`)
          .join('\n');
        out.push(`<table>\n<thead>\n<tr>${hCells}</tr>\n</thead>\n<tbody>\n${rows}\n</tbody>\n</table>`);
        break;
      }
    }
  }

  return out.join('\n\n');
}

function renderInline(text: string, options: RenderMarkdownOptions): string {
  let res = text;

  // Code snippets: `code`
  const codeSnippets: string[] = [];
  res = res.replace(/`([^`]+)`/g, (_, code) => {
    codeSnippets.push(code);
    return `\x00CODE_${codeSnippets.length - 1}\x00`;
  });

  // Raw HTML handling
  if (!options.allowRawHtml) {
    res = res.replace(/<([^>]+)>/g, (m) => {
      if (/^<https?:\/\/[^>]+>$/i.test(m) || /^<[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}>$/.test(m)) {
        return m;
      }
      return escapeHtml(m);
    });
  }

  // Images: ![alt](url)
  res = res.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

  // Links: [text](url)
  res = res.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Bold: **text** or __text__
  res = res.replace(/(\*\*|__)(.*?)\1/g, '<strong>$2</strong>');

  // Italic: *text* or _text_
  res = res.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  res = res.replace(/(?<!_)_(?!_)(.*?)(?<!_)_(?!_)/g, '<em>$1</em>');

  // Restore code snippets
  res = res.replace(/\x00CODE_(\d+)\x00/g, (_, idx) => `<code>${escapeHtml(codeSnippets[Number(idx)]!)}</code>`);

  if (options.breaks) {
    res = res.replace(/\n/g, '<br>\n');
  }

  return res;
}
