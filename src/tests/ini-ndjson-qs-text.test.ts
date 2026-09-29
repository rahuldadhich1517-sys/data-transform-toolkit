import { describe, it, expect } from 'vitest';
import {
  iniToJson,
  ndjsonToJson,
  querystringToJson,
  textToJson,
  textToHtml
} from '../index.js';
import { IniParseError, InvalidInputError } from '../errors/index.js';

describe('iniToJson', () => {
  it('parses basic sections and key-values', () => {
    const ini = `
; Database config
[database]
host = localhost
port = 5432

[app]
name = "My App"
`;
    const result = iniToJson(ini);
    expect(result).toEqual({
      database: {
        host: 'localhost',
        port: '5432'
      },
      app: {
        name: 'My App'
      }
    });
  });

  it('supports duplicate key strategies', () => {
    const ini = `
[tags]
item = one
item = two
`;
    expect(iniToJson(ini, { duplicateKeyStrategy: 'last' })).toEqual({
      tags: { item: 'two' }
    });
    expect(iniToJson(ini, { duplicateKeyStrategy: 'first' })).toEqual({
      tags: { item: 'one' }
    });
    expect(iniToJson(ini, { duplicateKeyStrategy: 'array' })).toEqual({
      tags: { item: ['one', 'two'] }
    });
    expect(() => iniToJson(ini, { duplicateKeyStrategy: 'error' })).toThrow(IniParseError);
  });

  it('supports nested sections', () => {
    const ini = `
[server.http]
port = 80
`;
    const result = iniToJson(ini, { nestedSections: true });
    expect(result).toEqual({
      server: {
        http: {
          port: '80'
        }
      }
    });
  });
});

describe('ndjsonToJson', () => {
  it('parses valid NDJSON lines', () => {
    const ndjson = '{"id":1}\n{"id":2}\n{"id":3}';
    expect(ndjsonToJson(ndjson)).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
  });

  it('skips empty lines and comments when configured', () => {
    const ndjson = `
{"a":1}

# comment
{"b":2}
`;
    expect(ndjsonToJson(ndjson, { ignoreEmptyLines: true, allowComments: true })).toEqual([
      { a: 1 },
      { b: 2 }
    ]);
  });

  it('throws descriptive error on malformed line', () => {
    const ndjson = '{"id":1}\nINVALID_JSON\n{"id":3}';
    expect(() => ndjsonToJson(ndjson)).toThrow(InvalidInputError);
  });
});

describe('querystringToJson', () => {
  it('parses query string with array keys and decoding', () => {
    const qs = '?name=Rahul&age=23&tags=js&tags=ts&plus=hello+world';
    const result = querystringToJson(qs);
    expect(result).toEqual({
      name: 'Rahul',
      age: '23',
      tags: ['js', 'ts'],
      plus: 'hello world'
    });
  });

  it('handles empty query string', () => {
    expect(querystringToJson('')).toEqual({});
  });

  it('respects repeatedKeyStrategy', () => {
    const qs = 'k=1&k=2';
    expect(querystringToJson(qs, { repeatedKeyStrategy: 'last' })).toEqual({ k: '2' });
    expect(querystringToJson(qs, { repeatedKeyStrategy: 'first' })).toEqual({ k: '1' });
  });
});

describe('textToJson and textToHtml', () => {
  it('parses key: value text lines into JSON', () => {
    const text = `
name: Rahul
age: 23
city: Bengaluru
`;
    const result = textToJson(text);
    expect(result).toEqual({
      name: 'Rahul',
      age: '23',
      city: 'Bengaluru'
    });
  });

  it('parses text to semantic HTML paragraphs', () => {
    const text = 'Hello world.\n\nThis is paragraph two.';
    const html = textToHtml(text);
    expect(html).toBe('<p>Hello world.</p>\n<p>This is paragraph two.</p>');
  });

  it('escapes dangerous HTML characters in textToHtml', () => {
    const text = '<script>alert(1)</script>';
    const html = textToHtml(text);
    expect(html).toBe('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
  });
});
