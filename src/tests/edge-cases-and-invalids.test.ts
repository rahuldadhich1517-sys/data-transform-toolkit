import { describe, it, expect } from 'vitest';
import {
  jsonToCsv,
  csvToJson,
  jsonToYaml,
  yamlToJson,
  jsonToXml,
  xmlToJson,
  dataDiff,
  envToJson,
  jsonToEnv,
  iniToJson,
  querystringToJson,
  ndjsonToJson,
  csvToExcel,
  csvToHtml,
  csvToMarkdown,
  csvToSql,
  csvToTsv,
  tsvToCsv,
  csvToXml,
  csvToYaml,
  textToCsv,
  xmlToCsv,
  sqlToCsv,
  excelToCsv,
  excelToJson,
  htmlTableToJson,
  htmlToMarkdown,
  htmlToText,
  htmlFormatter,
  markdownToHtml,
  markdownToRst,
  markdownToSlack,
  markdownToText,
  textToHtml,
  textToJson,
  tomlToJson,
  tomlToYaml,
  xmlFormat,
  xmlToJsonParser,
  xmlToYaml,
  xmlValidate,
  yamlDiff,
  yamlFormat,
  yamlToProperties,
  yamlToToml,
  yamlValidate,
  sqlToJson,
  jsObjectToJson,
  plistToJson,
  protobufDecode,
  InvalidInputError,
  CsvParseError,
  YamlParseError,
  XmlParseError,
  TomlParseError,
  SqlParseError,
  HtmlParseError,
  ProtobufDecodeError,
  JsObjectParseError,
  IniParseError,
  EnvParseError,
  DataConversionError
} from '../index.js';

describe('Edge Cases and Invalid Inputs Testing', () => {
  describe('Input Type Validation (Non-string / Non-object / Non-buffer)', () => {
    it('string-based converters reject non-string inputs with InvalidInputError or domain error', async () => {
      const invalidInputs = [null, undefined, 123, true, {}, [], Symbol('test')];

      for (const input of invalidInputs) {
        // Delimited
        expect(() => csvToHtml(input as any)).toThrow(InvalidInputError);
        expect(() => csvToMarkdown(input as any)).toThrow(InvalidInputError);
        expect(() => csvToSql(input as any)).toThrow(InvalidInputError);
        expect(() => csvToTsv(input as any)).toThrow(InvalidInputError);
        expect(() => tsvToCsv(input as any)).toThrow(InvalidInputError);
        expect(() => csvToXml(input as any)).toThrow(InvalidInputError);
        expect(() => csvToYaml(input as any)).toThrow(InvalidInputError);
        expect(() => textToCsv(input as any)).toThrow(InvalidInputError);
        expect(() => sqlToCsv(input as any)).toThrow(InvalidInputError);
        expect(() => xmlToCsv(input as any)).toThrow(InvalidInputError);
        await expect(() => csvToExcel(input as any)).rejects.toThrow(InvalidInputError);

        // HTML
        expect(() => htmlTableToJson(input as any)).toThrow(InvalidInputError);
        expect(() => htmlToMarkdown(input as any)).toThrow(InvalidInputError);
        expect(() => htmlToText(input as any)).toThrow(InvalidInputError);
        expect(() => htmlFormatter(input as any)).toThrow(InvalidInputError);

        // Markdown
        expect(() => markdownToHtml(input as any)).toThrow(InvalidInputError);
        expect(() => markdownToRst(input as any)).toThrow(InvalidInputError);
        expect(() => markdownToSlack(input as any)).toThrow(InvalidInputError);
        expect(() => markdownToText(input as any)).toThrow(InvalidInputError);

        // Text
        expect(() => textToHtml(input as any)).toThrow(InvalidInputError);
        expect(() => textToJson(input as any)).toThrow(InvalidInputError);

        // TOML
        expect(() => tomlToJson(input as any)).toThrow(InvalidInputError);
        expect(() => tomlToYaml(input as any)).toThrow(InvalidInputError);

        // XML
        expect(() => xmlFormat(input as any)).toThrow(InvalidInputError);
        expect(() => xmlToJsonParser(input as any)).toThrow(InvalidInputError);
        expect(() => xmlToYaml(input as any)).toThrow(InvalidInputError);

        // YAML
        expect(() => yamlFormat(input as any)).toThrow(InvalidInputError);
        expect(() => yamlToProperties(input as any)).toThrow(InvalidInputError);
        expect(() => yamlToToml(input as any)).toThrow(InvalidInputError);

        // Specialized
        expect(() => sqlToJson(input as any)).toThrow(InvalidInputError);
        expect(() => jsObjectToJson(input as any)).toThrow(InvalidInputError);
        expect(() => plistToJson(input as any)).toThrow(InvalidInputError);

        // Env / Config / Querystring / NDJSON
        expect(() => envToJson(input as any)).toThrow(EnvParseError);
        expect(() => iniToJson(input as any)).toThrow(IniParseError);
        expect(() => querystringToJson(input as any)).toThrow(InvalidInputError);
        expect(() => ndjsonToJson(input as any)).toThrow(InvalidInputError);

        // Core parsers
        expect(() => csvToJson(input as any)).toThrow(CsvParseError);
        expect(() => yamlToJson(input as any)).toThrow(YamlParseError);
        expect(() => xmlToJson(input as any)).toThrow(XmlParseError);
      }
    });

    it('yamlDiff rejects non-string inputs', () => {
      expect(() => yamlDiff(null as any, 'a: 1')).toThrow(InvalidInputError);
      expect(() => yamlDiff('a: 1', 123 as any)).toThrow(InvalidInputError);
      expect(() => yamlDiff(undefined as any, undefined as any)).toThrow(InvalidInputError);
    });

    it('jsonToEnv rejects non-object inputs', () => {
      expect(() => jsonToEnv(null as any)).toThrow(InvalidInputError);
      expect(() => jsonToEnv(undefined as any)).toThrow(InvalidInputError);
      expect(() => jsonToEnv('string' as any)).toThrow(InvalidInputError);
      expect(() => jsonToEnv(123 as any)).toThrow(InvalidInputError);
      expect(() => jsonToEnv([1, 2, 3] as any)).toThrow(InvalidInputError);
    });

    it('jsonToCsv rejects non-array inputs', () => {
      expect(() => jsonToCsv(null as any)).toThrow(DataConversionError);
      expect(() => jsonToCsv(undefined as any)).toThrow(DataConversionError);
      expect(() => jsonToCsv('string' as any)).toThrow(DataConversionError);
      expect(() => jsonToCsv({ a: 1 } as any)).toThrow(DataConversionError);
    });

    it('excel converters reject non-buffer / non-Uint8Array inputs', async () => {
      const invalids = [null, undefined, 'string', 123, {}, []];
      for (const inv of invalids) {
        await expect(() => excelToCsv(inv as any)).rejects.toThrow(InvalidInputError);
        await expect(() => excelToJson(inv as any)).rejects.toThrow(InvalidInputError);
      }
    });

    it('protobufDecode rejects invalid input types', () => {
      expect(() => protobufDecode(null as any)).toThrow(ProtobufDecodeError);
      expect(() => protobufDecode(undefined as any)).toThrow(ProtobufDecodeError);
      expect(() => protobufDecode(123 as any)).toThrow(ProtobufDecodeError);
      expect(() => protobufDecode({} as any)).toThrow(ProtobufDecodeError);
    });
  });

  describe('Empty and Whitespace Inputs', () => {
    it('handles empty strings gracefully returning expected defaults', () => {
      expect(csvToHtml('')).toBe('<table>\n  <tbody>\n  </tbody>\n</table>');
      expect(csvToHtml('   \n  ')).toBe('<table>\n  <tbody>\n  </tbody>\n</table>');
      expect(csvToMarkdown('')).toBe('');
      expect(csvToMarkdown('   ')).toBe('');
      expect(csvToSql('')).toBe('');
      expect(csvToSql('   ')).toBe('');
      expect(csvToTsv('')).toBe('');
      expect(tsvToCsv('')).toBe('');
      expect(csvToXml('')).toBe('<root></root>');
      expect(csvToXml('', { includeDeclaration: true })).toBe('<?xml version="1.0" encoding="UTF-8"?>\n<root></root>');
      expect(csvToYaml('')).toBe('[]\n');
      expect(textToCsv('')).toBe('');
      expect(sqlToCsv('')).toBe('');
      expect(xmlToCsv('')).toBe('');

      expect(htmlTableToJson('')).toEqual([]);
      expect(htmlToMarkdown('')).toBe('');
      expect(htmlToText('')).toBe('');
      expect(htmlFormatter('')).toBe('');

      expect(markdownToHtml('')).toBe('');
      expect(markdownToRst('')).toBe('');
      expect(markdownToSlack('')).toBe('');
      expect(markdownToText('')).toBe('');

      expect(textToHtml('')).toBe('');
      expect(textToJson('')).toEqual({});

      expect(tomlToJson('')).toEqual({});
      expect(tomlToYaml('')).toBe('{}');

      expect(xmlFormat('')).toBe('');
      expect(xmlToJson('')).toEqual({});
      expect(xmlToJsonParser('')).toEqual({});
      expect(xmlToYaml('')).toBe('{}\n');

      expect(yamlFormat('')).toBe('');
      expect(yamlToJson('')).toBeNull();
      expect(yamlToProperties('')).toBe('');
      expect(yamlToToml('')).toBe('');

      expect(sqlToJson('')).toEqual([]);
      expect(plistToJson('')).toBeNull();
      expect(querystringToJson('')).toEqual({});
      expect(ndjsonToJson('')).toEqual([]);

      expect(jsonToCsv([])).toBe('');
      expect(jsonToEnv({})).toBe('');
    });

    it('csvToExcel handles empty CSV string', async () => {
      const buf = await csvToExcel('');
      expect(Buffer.isBuffer(buf)).toBe(true);
      const csvBack = await excelToCsv(buf);
      expect(csvBack).toBe('');
    });
  });

  describe('Validation Functions Handling of Invalid Inputs', () => {
    it('xmlValidate returns valid: false for non-string, empty, or malformed XML without throwing', () => {
      const r1 = xmlValidate(null as any);
      expect(r1.valid).toBe(false);
      expect(r1.errors[0]?.message).toContain('Input must be a string');

      const r2 = xmlValidate('');
      expect(r2.valid).toBe(false);
      expect(r2.errors[0]?.message).toContain('Empty XML');

      const r3 = xmlValidate('<root><unclosed></root>');
      expect(r3.valid).toBe(false);
      expect(r3.errors.length).toBeGreaterThan(0);
    });

    it('yamlValidate returns valid: false for non-string or malformed YAML without throwing', () => {
      const r1 = yamlValidate(null as any);
      expect(r1.valid).toBe(false);
      expect(r1.errors[0]?.message).toContain('Input must be a string');

      const r2 = yamlValidate('key: "unclosed string');
      expect(r2.valid).toBe(false);
      expect(r2.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Malformed Syntax Rejections', () => {
    describe('CSV parsing', () => {
      it('throws CsvParseError on unclosed quote in strict mode', () => {
        expect(() => csvToJson('"unclosed quote,val', { strict: true })).toThrow(CsvParseError);
      });

      it('throws CsvParseError when field exceeds maxFieldLength', () => {
        const longField = 'a'.repeat(20);
        expect(() => csvToJson(`name\n${longField}`, { maxFieldLength: 10 })).toThrow(CsvParseError);
      });

      it('throws CsvParseError on unexpected quote in strict mode', () => {
        expect(() => csvToJson('name\nabc"def', { strict: true })).toThrow(CsvParseError);
      });
    });

    describe('XML parsing', () => {
      it('throws XmlParseError on unclosed tag', () => {
        expect(() => xmlToJson('<root><child>value</root>', { strict: true })).toThrow(XmlParseError);
      });

      it('throws XmlParseError on unclosed comment', () => {
        expect(() => xmlToJson('<root><!-- unclosed</root>')).toThrow(XmlParseError);
      });

      it('throws XmlParseError on unclosed CDATA', () => {
        expect(() => xmlToJson('<root><![CDATA[ unclosed</root>')).toThrow(XmlParseError);
      });

      it('throws XmlParseError on missing root element', () => {
        expect(() => xmlToJson('only text without tags')).toThrow(XmlParseError);
      });

      it('throws InvalidInputError on invalid root element in csvToXml', () => {
        expect(() => csvToXml('a,b\n1,2', { rootElement: 'invalid root<tag>' })).toThrow(InvalidInputError);
        expect(() => csvToXml('a,b\n1,2', { rowElement: '123_invalid_row' })).toThrow(InvalidInputError);
      });

      it('throws XmlParseError on unclosed tag in xmlFormat', () => {
        expect(() => xmlFormat('<root><unclosed>')).toThrow(XmlParseError);
      });
    });

    describe('YAML parsing', () => {
      it('throws YamlParseError on invalid indentation in strict mode', () => {
        const yaml = 'root:\n      child1: 1\n  child2: 2';
        expect(() => yamlToJson(yaml, { strict: true })).toThrow(YamlParseError);
      });

      it('throws YamlParseError when maxDepth exceeded', () => {
        const nested = 'a:\n  b:\n    c: 1';
        expect(() => yamlToJson(nested, { maxDepth: 1 })).toThrow(YamlParseError);
      });

      it('yamlToToml throws InvalidInputError when root is not an object', () => {
        expect(() => yamlToToml('- item1\n- item2')).toThrow(InvalidInputError);
        expect(() => yamlToToml('just a string')).toThrow(InvalidInputError);
      });
    });

    describe('TOML parsing', () => {
      it('throws TomlParseError on missing equal sign in key-value', () => {
        expect(() => tomlToJson('invalid_line_without_equal')).toThrow(TomlParseError);
      });

      it('throws TomlParseError on unclosed multiline string', () => {
        expect(() => tomlToJson('msg = """unclosed\nmultiline')).toThrow(TomlParseError);
      });

      it('throws TomlParseError on invalid inline table syntax', () => {
        expect(() => tomlToJson('table = { missing_equal }')).toThrow(TomlParseError);
      });

      it('throws TomlParseError on empty dotted key segment', () => {
        expect(() => tomlToJson('a..b = 1')).toThrow(TomlParseError);
      });
    });

    describe('SQL parsing', () => {
      it('throws SqlParseError on non-INSERT statement', () => {
        expect(() => sqlToJson('SELECT * FROM users;')).toThrow(SqlParseError);
        expect(() => sqlToJson('UPDATE users SET name="Bob";')).toThrow(SqlParseError);
        expect(() => sqlToJson('DELETE FROM users;')).toThrow(SqlParseError);
      });

      it('throws SqlParseError on malformed INSERT syntax', () => {
        expect(() => sqlToJson('INSERT INTO')).toThrow(SqlParseError);
        expect(() => sqlToJson('INSERT INTO users')).toThrow(SqlParseError);
        expect(() => sqlToJson('INSERT INTO users VALUES')).toThrow(SqlParseError);
        expect(() => sqlToJson('INSERT INTO users (id, name VALUES (1, "Bob");')).toThrow(SqlParseError);
        expect(() => sqlToJson('INSERT INTO users (id, name) VALUES 1, "Bob";')).toThrow(SqlParseError);
        expect(() => sqlToJson('INSERT INTO "unclosed_table (id) VALUES (1);')).toThrow(SqlParseError);
      });
    });

    describe('HTML formatting & parsing', () => {
      it('throws HtmlParseError on unmatched tag in strict mode', () => {
        expect(() => htmlFormatter('<div><span></div></span>', { strict: true })).toThrow(HtmlParseError);
      });

      it('throws HtmlParseError on unclosed tags in strict mode', () => {
        expect(() => htmlFormatter('<div><p>Unclosed paragraph', { strict: true })).toThrow(HtmlParseError);
      });

      it('throws HtmlParseError on unclosed comments or doctypes', () => {
        expect(() => htmlFormatter('<!-- unclosed comment')).toThrow(HtmlParseError);
        expect(() => htmlFormatter('<!DOCTYPE html')).toThrow(HtmlParseError);
      });
    });

    describe('Protobuf wire decoding', () => {
      it('throws ProtobufDecodeError on invalid hex string', () => {
        expect(() => protobufDecode('xyz123')).toThrow(ProtobufDecodeError);
        expect(() => protobufDecode('089')).toThrow(ProtobufDecodeError); // Odd length
      });

      it('throws ProtobufDecodeError on field number 0', () => {
        // Tag 0 (0 << 3 | 0) -> invalid field number 0
        expect(() => protobufDecode('0001')).toThrow(ProtobufDecodeError);
      });

      it('throws ProtobufDecodeError on truncated fixed32 or fixed64', () => {
        // Wire type 5 (fixed32): tag = 1 << 3 | 5 = 0x0d. Needs 4 bytes, only provide 2 bytes
        expect(() => protobufDecode('0d0102')).toThrow(ProtobufDecodeError);
        // Wire type 1 (fixed64): tag = 1 << 3 | 1 = 0x09. Needs 8 bytes, only provide 4 bytes
        expect(() => protobufDecode('0901020304')).toThrow(ProtobufDecodeError);
      });

      it('throws ProtobufDecodeError on truncated length-delimited field', () => {
        // Wire type 2: tag = 1 << 3 | 2 = 0x0a, length = 10 (0x0a), but only 2 bytes data
        expect(() => protobufDecode('0a0a0102')).toThrow(ProtobufDecodeError);
      });

      it('throws ProtobufDecodeError on varint overflow (> 10 bytes)', () => {
        // 11 bytes of 0x80
        const overflow = '08' + '80'.repeat(11);
        expect(() => protobufDecode(overflow)).toThrow(ProtobufDecodeError);
      });
    });

    describe('JS Object Literal parser', () => {
      it('throws JsObjectParseError on empty input', () => {
        expect(() => jsObjectToJson('')).toThrow(JsObjectParseError);
        expect(() => jsObjectToJson('   ')).toThrow(JsObjectParseError);
      });

      it('throws JsObjectParseError on unclosed quotes', () => {
        expect(() => jsObjectToJson('{ name: "unclosed }')).toThrow(JsObjectParseError);
        expect(() => jsObjectToJson("{ name: 'unclosed }")).toThrow(JsObjectParseError);
      });

      it('throws JsObjectParseError on unclosed object or array', () => {
        expect(() => jsObjectToJson('{ name: "Bob"')).toThrow(JsObjectParseError);
        expect(() => jsObjectToJson('[1, 2, 3')).toThrow(JsObjectParseError);
      });

      it('throws JsObjectParseError on invalid number format', () => {
        expect(() => jsObjectToJson('{ num: 12.34.56 }')).toThrow(JsObjectParseError);
      });

      it('throws JsObjectParseError on invalid unicode escape', () => {
        expect(() => jsObjectToJson('{ str: "\\uZZZZ" }')).toThrow(JsObjectParseError);
      });

      it('throws JsObjectParseError on trailing unexpected tokens', () => {
        expect(() => jsObjectToJson('{ a: 1 } extra trailing stuff')).toThrow(JsObjectParseError);
      });

      it('throws JsObjectParseError on missing colon', () => {
        expect(() => jsObjectToJson('{ a 1 }')).toThrow(JsObjectParseError);
      });
    });

    describe('INI parser', () => {
      it('throws IniParseError on empty section header', () => {
        expect(() => iniToJson('[]\nkey=val')).toThrow(IniParseError);
      });

      it('throws IniParseError on line without separator', () => {
        expect(() => iniToJson('[section]\ninvalid_line_without_sep')).toThrow(IniParseError);
      });

      it('throws IniParseError on empty key', () => {
        expect(() => iniToJson('[section]\n=value')).toThrow(IniParseError);
      });

      it('throws IniParseError on duplicate keys when duplicateKeyStrategy is error', () => {
        const ini = '[sec]\nkey=val1\nkey=val2';
        expect(() => iniToJson(ini, { duplicateKeyStrategy: 'error' })).toThrow(IniParseError);
      });
    });

    describe('ENV parser', () => {
      it('throws EnvParseError on line without equals sign', () => {
        expect(() => envToJson('INVALID_LINE')).toThrow(EnvParseError);
      });

      it('throws EnvParseError on invalid variable name', () => {
        expect(() => envToJson('123_INVALID=val')).toThrow(EnvParseError);
        expect(() => envToJson('KEY WITH SPACES=val')).toThrow(EnvParseError);
      });

      it('throws EnvParseError on unclosed quotes', () => {
        expect(() => envToJson('KEY="unclosed double quote')).toThrow(EnvParseError);
        expect(() => envToJson("KEY='unclosed single quote")).toThrow(EnvParseError);
      });

      it('jsonToEnv throws InvalidInputError on invalid environment variable key names', () => {
        expect(() => jsonToEnv({ '123_INVALID': 'val' })).toThrow(InvalidInputError);
        expect(() => jsonToEnv({ 'KEY WITH SPACES': 'val' })).toThrow(InvalidInputError);
      });

      it('jsonToEnv throws InvalidInputError on nested objects when flatten=false', () => {
        expect(() => jsonToEnv({ nested: { a: 1 } }, { flatten: false })).toThrow(InvalidInputError);
      });
    });

    describe('Plist parser', () => {
      it('rejects binary plist format', () => {
        expect(() => plistToJson('bplist00\x01\x02...')).toThrow(InvalidInputError);
      });

      it('throws InvalidInputError on missing <plist> root element', () => {
        expect(() => plistToJson('<dict><key>a</key><string>b</string></dict>')).toThrow(InvalidInputError);
      });
    });

    describe('Text to JSON parser', () => {
      it('throws InvalidInputError when specified separator is not found', () => {
        expect(() => textToJson('key=value\nline2', { separator: ':' })).toThrow(InvalidInputError);
      });

      it('throws InvalidInputError when no separator found in line', () => {
        expect(() => textToJson('line_without_separator')).toThrow(InvalidInputError);
      });

      it('throws InvalidInputError on duplicate keys when duplicateKeyStrategy is error', () => {
        const text = 'key: val1\nkey: val2';
        expect(() => textToJson(text, { duplicateKeyStrategy: 'error' })).toThrow(InvalidInputError);
      });
    });

    describe('NDJSON parser', () => {
      it('throws InvalidInputError on malformed JSON line in strict mode', () => {
        expect(() => ndjsonToJson('{"a": 1}\n{bad json}\n{"b": 2}', { strict: true })).toThrow(InvalidInputError);
      });

      it('throws InvalidInputError on unexpected empty line when ignoreEmptyLines: false in strict mode', () => {
        expect(() => ndjsonToJson('{"a": 1}\n\n{"b": 2}', { ignoreEmptyLines: false, strict: true })).toThrow(InvalidInputError);
      });
    });

    describe('Excel parsers', () => {
      it('throws InvalidInputError on corrupted Excel buffer', async () => {
        const badBuffer = Buffer.from('corrupted zip/excel data');
        await expect(() => excelToCsv(badBuffer)).rejects.toThrow(InvalidInputError);
        await expect(() => excelToJson(badBuffer)).rejects.toThrow(InvalidInputError);
      });

      it('throws InvalidInputError on non-existent sheet name', async () => {
        const validXlsx = await csvToExcel('a,b\n1,2');
        await expect(() => excelToCsv(validXlsx, { sheet: 'NonExistentSheet' })).rejects.toThrow(InvalidInputError);
        await expect(() => excelToJson(validXlsx, { sheet: 'NonExistentSheet' })).rejects.toThrow(InvalidInputError);
      });

      it('throws InvalidInputError on out-of-range sheet index', async () => {
        const validXlsx = await csvToExcel('a,b\n1,2');
        await expect(() => excelToCsv(validXlsx, { sheet: 99 })).rejects.toThrow(InvalidInputError);
        await expect(() => excelToJson(validXlsx, { sheet: 99 })).rejects.toThrow(InvalidInputError);
      });
    });
  });
});
