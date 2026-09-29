/**
 * Markdown to Slack mrkdwn Converter
 */

import { tokenizeMarkdown } from '../internal/markdown.js';
import { InvalidInputError } from '../errors/index.js';

export interface MarkdownToSlackOptions {
  /** If true, escape raw HTML characters & < > outside of Slack markup. Defaults to true */
  escapeSpecialChars?: boolean;
}

/**
 * Convert Markdown text into Slack mrkdwn formatting
 */
export function markdownToSlack(
  markdown: string,
  options: MarkdownToSlackOptions = {}
): string {
  if (typeof markdown !== 'string') {
    throw new InvalidInputError('Input must be a string');
  }

  const trimmed = markdown.trim();
  if (!trimmed) {
    return '';
  }

  const tokens = tokenizeMarkdown(markdown);
  const out: string[] = [];

  for (const token of tokens) {
    switch (token.type) {
      case 'heading': {
        const text = convertInlineMdToSlack(token.text, options.escapeSpecialChars !== false);
        out.push(`*${text}*`);
        break;
      }

      case 'paragraph': {
        out.push(convertInlineMdToSlack(token.text, options.escapeSpecialChars !== false));
        break;
      }

      case 'code': {
        out.push(`\`\`\`\n${token.text}\n\`\`\``);
        break;
      }

      case 'blockquote': {
        const quoteLines = token.text
          .split('\n')
          .map(l => `> ${convertInlineMdToSlack(l, options.escapeSpecialChars !== false)}`);
        out.push(quoteLines.join('\n'));
        break;
      }

      case 'list': {
        const items: string[] = [];
        for (let i = 0; i < token.items.length; i++) {
          const item = token.items[i]!;
          const prefix = token.ordered ? `${i + 1}. ` : '• ';
          const text = convertInlineMdToSlack(item.text, options.escapeSpecialChars !== false);
          items.push(`${prefix}${text}`);
        }
        out.push(items.join('\n'));
        break;
      }

      case 'hr':
        out.push('---');
        break;
    }
  }

  return out.join('\n\n').trim();
}

function convertInlineMdToSlack(text: string, escapeSpecial: boolean): string {
  // Extract code snippets first so we don't mess with them
  const codeBlocks: string[] = [];
  let result = text.replace(/`([^`]+)`/g, (_, code) => {
    codeBlocks.push(code);
    return `\x00CODE_${codeBlocks.length - 1}\x00`;
  });

  if (escapeSpecial) {
    result = result
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Links: [Text](url) -> <url|Text>
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<$2|$1>');

  // Bold: **bold** or __bold__ -> placeholder
  const boldBlocks: string[] = [];
  result = result.replace(/(\*\*|__)(.*?)\1/g, (_, __, content) => {
    boldBlocks.push(content);
    return `\x00BOLD_${boldBlocks.length - 1}\x00`;
  });

  // Strikethrough: ~~strike~~ -> ~strike~
  result = result.replace(/~~(.*?)~~/g, '~$1~');

  // Italic: *italic* or _italic_ -> _italic_
  result = result.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '_$1_');
  result = result.replace(/(?<!_)_(?!_)(.*?)(?<!_)_(?!_)/g, '_$1_');

  // Restore bold
  result = result.replace(/\x00BOLD_(\d+)\x00/g, (_, idx) => `*${boldBlocks[Number(idx)]}*`);

  // Restore inline code
  result = result.replace(/\x00CODE_(\d+)\x00/g, (_, idx) => `\`${codeBlocks[Number(idx)]}\``);

  return result;
}
