import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  csvToHtml,
  csvToSql,
  csvToXml,
  textToHtml,
  markdownToHtml,
  htmlToText,
  jsObjectToJson,
  protobufDecode,
  dataDiff,
  xmlToJson,
  yamlToJson,
  csvToJson,
  iniToJson,
  envToJson,
  querystringToJson,
  htmlTableToJson,
  tomlToJson,
  SecurityError,
  JsObjectParseError,
  ProtobufDecodeError,
  DataDiffError,
  XmlParseError,
  YamlParseError,
  CsvParseError
} from '../index.js';

describe('Security and Safety Testing', () => {
  describe('Prototype Pollution Prevention', () => {
    let cleanPrototypeKeys: string[];

    beforeEach(() => {
      cleanPrototypeKeys = Object.getOwnPropertyNames(Object.prototype);
    });

    afterEach(() => {
      // Ensure Object.prototype was not polluted
      const currentKeys = Object.getOwnPropertyNames(Object.prototype);
      expect(currentKeys).toEqual(cleanPrototypeKeys);
      expect((Object.prototype as any).polluted).toBeUndefined();
      expect((Object.prototype as any).isAdmin).toBeUndefined();
    });

    it('prevents prototype pollution via iniToJson', () => {
      const payload = `
[__proto__]
polluted = true
isAdmin = true
[constructor.prototype]
polluted = true
`;
      const res = iniToJson(payload);
      expect((Object.prototype as any).polluted).toBeUndefined();
      expect((Object.prototype as any).isAdmin).toBeUndefined();
    });

    it('prevents prototype pollution via envToJson', () => {
      const payload = `
__proto____polluted=true
constructor__prototype__isAdmin=true
`;
      const res = envToJson(payload, { nested: true });
      expect((Object.prototype as any).polluted).toBeUndefined();
      expect((Object.prototype as any).isAdmin).toBeUndefined();
    });

    it('prevents prototype pollution via querystringToJson', () => {
      const qs = '__proto__[polluted]=true&constructor[prototype][isAdmin]=true';
      const res = querystringToJson(qs);
      expect((Object.prototype as any).polluted).toBeUndefined();
      expect((Object.prototype as any).isAdmin).toBeUndefined();
    });

    it('prevents prototype pollution via tomlToJson', () => {
      const toml = `
["__proto__"]
polluted = "true"
`;
      const res = tomlToJson(toml);
      expect((Object.prototype as any).polluted).toBeUndefined();
    });

    it('prevents prototype pollution via htmlTableToJson', () => {
      const html = `
<table>
  <thead><tr><th>__proto__</th><th>name</th></tr></thead>
  <tbody><tr><td>polluted</td><td>Alice</td></tr></tbody>
</table>`;
      const res = htmlTableToJson(html) as Record<string, string>[];
      expect(res[0]?.name).toBe('Alice');
      expect((Object.prototype as any).polluted).toBeUndefined();
    });

    it('prevents prototype pollution via jsObjectToJson', () => {
      const jsObj = '{ "__proto__": { "polluted": true } }';
      const res = JSON.parse(jsObjectToJson(jsObj));
      expect((Object.prototype as any).polluted).toBeUndefined();
    });
  });

  describe('XSS and Markup Injection Safety', () => {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src="x" onerror="alert(1)">',
      '<iframe src="javascript:alert(1)"></iframe>',
      '"><script>alert(1)</script>'
    ];

    it('csvToHtml escapes script tags and malicious attributes', () => {
      for (const payload of xssPayloads) {
        const csv = `name,action\nAlice,"${payload}"`;
        const html = csvToHtml(csv);
        expect(html).not.toContain('<script>');
        expect(html).not.toContain('<iframe');
        expect(html).toContain('&lt;');
        expect(html).toContain('&gt;');
      }
    });

    it('csvToHtml rejects unsafe attribute names', () => {
      const csv = 'name\nAlice';
      const html = csvToHtml(csv, {
        attributes: {
          'onclick="alert(1)"': 'bad',
          'data-safe': 'good'
        }
      });
      expect(html).not.toContain('onclick');
      expect(html).toContain('data-safe="good"');
    });

    it('textToHtml escapes HTML entities and tags', () => {
      for (const payload of xssPayloads) {
        const html = textToHtml(payload);
        expect(html).not.toContain('<script>');
        expect(html).toContain('&lt;');
        expect(html).toContain('&gt;');
      }
    });

    it('markdownToHtml escapes raw HTML by default', () => {
      for (const payload of xssPayloads) {
        const html = markdownToHtml(payload);
        expect(html).not.toContain('<script>');
        expect(html).toContain('&lt;');
      }
    });

    it('csvToXml escapes XML special characters in cell values', () => {
      const csv = 'id,payload\n1,<script>alert(1)</script>&"\'';
      const xml = csvToXml(csv);
      expect(xml).not.toContain('<script>');
      expect(xml).toContain('&lt;script&gt;');
      expect(xml).toContain('&amp;');
      expect(xml).toContain('&quot;');
    });

    it('htmlToText strips scripts and styles completely', () => {
      const dirtyHtml = '<p>Safe</p><script>alert("hack")</script><style>body { color: red; }</style><span>Text</span>';
      const clean = htmlToText(dirtyHtml);
      expect(clean).toContain('Safe');
      expect(clean).toContain('Text');
      expect(clean).not.toContain('alert');
      expect(clean).not.toContain('body {');
    });
  });

  describe('SQL Injection Prevention', () => {
    it('csvToSql safely escapes SQL injection in column values', () => {
      const csv = `id,name,comment\n1,Bobby,"Robert'); DROP TABLE Students;--"`;
      const sql = csvToSql(csv, { tableName: 'students' });

      expect(sql).toContain("INSERT INTO students (id, name, comment) VALUES");
      expect(sql).toContain("(1, 'Bobby', 'Robert''); DROP TABLE Students;--');");
      expect(sql).not.toContain("VALUES\n(1, 'Bobby', 'Robert'); DROP TABLE");
    });

    it('csvToSql throws SecurityError when identifier contains control characters', () => {
      expect(() => csvToSql('id\n1', { tableName: 'users\0evil' })).toThrow(SecurityError);
      expect(() => csvToSql('id\n1', { tableName: 'users\nevil' })).toThrow(SecurityError);
      expect(() => csvToSql('id\n1', { tableName: 'users\revil' })).toThrow(SecurityError);
    });

    it('csvToSql properly quotes identifiers across dialects', () => {
      const csv = 'user name,user id\nAlice,1';
      const stdSql = csvToSql(csv, { tableName: 'my table', dialect: 'standard' });
      expect(stdSql).toContain('INSERT INTO "my table" ("user name", "user id")');

      const mySql = csvToSql(csv, { tableName: 'my table', dialect: 'mysql' });
      expect(mySql).toContain('INSERT INTO `my table` (`user name`, `user id`)');

      const pgSql = csvToSql(csv, { tableName: 'my table', dialect: 'postgres' });
      expect(pgSql).toContain('INSERT INTO "my table" ("user name", "user id")');
    });
  });

  describe('Arbitrary Code Execution Safety in jsObjectToJson', () => {
    it('strictly prohibits function definitions, arrow functions, and calls', () => {
      const maliciousCases = [
        '{ fn: function() { process.exit(1); } }',
        '{ fn: () => console.log("pwned") }',
        '{ run: eval("1+1") }',
        '{ run: new Function("return 1")() }',
        '{ val: process.env.SECRET }',
        '{ val: globalThis }',
        '{ val: require("fs") }',
        '{ ...{ a: 1 } }',
        '{ [1+1]: "computed" }',
        '{ str: `template ${process.pid}` }'
      ];

      for (const payload of maliciousCases) {
        expect(() => jsObjectToJson(payload)).toThrow(JsObjectParseError);
      }
    });
  });

  describe('Denial of Service (DoS) and Resource Exhaustion Guards', () => {
    it('dataDiff throws DataDiffError when maxDepth exceeded', () => {
      let deep: any = { val: 1 };
      for (let i = 0; i < 20; i++) {
        deep = { nested: deep };
      }
      expect(() => dataDiff(deep, deep, { maxDepth: 10 })).toThrow(DataDiffError);
    });

    it('xmlToJson throws XmlParseError when maxDepth exceeded', () => {
      const deepXml = '<a'.repeat(25) + '/>' + '</a>'.repeat(24);
      // Construct properly balanced deep XML
      let xml = '<val>1</val>';
      for (let i = 0; i < 15; i++) {
        xml = `<node>${xml}</node>`;
      }
      expect(() => xmlToJson(xml, { maxDepth: 5 })).toThrow(XmlParseError);
    });

    it('yamlToJson throws YamlParseError when maxDepth exceeded', () => {
      let yaml = 'key: 1';
      for (let i = 0; i < 15; i++) {
        yaml = `level${i}:\n  ${yaml.replace(/\n/g, '\n  ')}`;
      }
      expect(() => yamlToJson(yaml, { maxDepth: 5 })).toThrow(YamlParseError);
    });

    it('csvToJson throws CsvParseError when single field exceeds maxFieldLength', () => {
      const hugeField = 'x'.repeat(100);
      expect(() => csvToJson(`name\n${hugeField}`, { maxFieldLength: 50 })).toThrow(CsvParseError);
    });

    it('protobufDecode guards against varint overflow loop (>10 bytes)', () => {
      const overflowPayload = '08' + 'ff'.repeat(11);
      expect(() => protobufDecode(overflowPayload)).toThrow(ProtobufDecodeError);
    });

    it('protobufDecode guards against truncated length-delimited payload', () => {
      // Field 1, wireType 2, length declared as 1,000,000 bytes, but empty data
      const fakeLengthPayload = '0a' + '80808001';
      expect(() => protobufDecode(fakeLengthPayload)).toThrow(ProtobufDecodeError);
    });
  });
});
