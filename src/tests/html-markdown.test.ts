import { describe, it, expect } from 'vitest';
import {
  htmlTableToJson,
  htmlToMarkdown,
  htmlToText,
  htmlFormatter,
  markdownToHtml,
  markdownToRst,
  markdownToSlack,
  markdownToText
} from '../index.js';

describe('HTML and Markdown Converters', () => {
  it('htmlTableToJson extracts table records correctly', () => {
    const html = `
    <table>
      <thead>
        <tr><th>Name</th><th>Role</th></tr>
      </thead>
      <tbody>
        <tr><td>Alice</td><td>Admin</td></tr>
        <tr><td>Bob</td><td>User</td></tr>
      </tbody>
    </table>`;
    const json = htmlTableToJson(html);
    expect(json).toEqual([
      { Name: 'Alice', Role: 'Admin' },
      { Name: 'Bob', Role: 'User' }
    ]);
  });

  it('htmlTableToJson handles colspan reasonably', () => {
    const html = `
    <table>
      <tr><th colspan="2">Info</th></tr>
      <tr><td>1</td><td>2</td></tr>
    </table>`;
    const json = htmlTableToJson(html);
    expect(json).toEqual([
      { Info: '1', Info_2: '2' }
    ]);
  });

  it('htmlToMarkdown converts common elements', () => {
    const html = '<h1>Title</h1><p>This is <b>bold</b> and <i>italic</i> with <a href="https://example.com">a link</a>.</p>';
    const md = htmlToMarkdown(html);
    expect(md).toContain('# Title');
    expect(md).toContain('**bold**');
    expect(md).toContain('*italic*');
    expect(md).toContain('[a link](https://example.com)');
  });

  it('htmlToText strips tags and extracts clean text', () => {
    const html = '<style>body { color: red; }</style><h1>Hello</h1><p>World &amp; Universe</p>';
    const text = htmlToText(html);
    expect(text).toBe('Hello\nWorld & Universe');
    expect(text).not.toContain('<style>');
  });

  it('htmlFormatter pretty-prints HTML with indentation', () => {
    const html = '<div><p>Hello</p><br><img src="test.png"></div>';
    const formatted = htmlFormatter(html, { indent: 2 });
    expect(formatted).toContain('<div>');
    expect(formatted).toContain('  <p>Hello</p>');
    expect(formatted).toContain('  <br>');
    expect(formatted).toContain('</div>');
  });

  it('markdownToHtml parses markdown securely without executing scripts', () => {
    const md = '# Title\n\n**bold text** and `code`\n\n<script>alert(1)</script>';
    const html = markdownToHtml(md);
    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('<strong>bold text</strong>');
    expect(html).toContain('<code>code</code>');
    expect(html).toContain('&lt;script&gt;'); // Safe raw HTML escaped
  });

  it('markdownToRst formats reStructuredText', () => {
    const md = '# Main Title\n\nParagraph with **bold** and `code`.\n\n- item 1\n- item 2';
    const rst = markdownToRst(md);
    expect(rst).toContain('Main Title\n==========');
    expect(rst).toContain('**bold**');
    expect(rst).toContain('``code``');
    expect(rst).toContain('- item 1');
  });

  it('markdownToSlack formats Slack mrkdwn', () => {
    const md = '# Title\n\nThis is **bold**, *italic*, and [link](https://slack.com).';
    const slack = markdownToSlack(md);
    expect(slack).toContain('*Title*');
    expect(slack).toContain('*bold*');
    expect(slack).toContain('_italic_');
    expect(slack).toContain('<https://slack.com|link>');
  });

  it('markdownToText strips markdown markup', () => {
    const md = '# Header\n\nCheck out [Google](https://google.com) and **bold** text!';
    const text = markdownToText(md);
    expect(text).toBe('Header\n\nCheck out Google and bold text!');
  });
});
