import { describe, it, expect } from 'vitest';
import * as Toolkit from '../index.js';

describe('Public API and Exports Verification', () => {
  const EXPECTED_FUNCTIONS = [
    'jsonToCsv',
    'csvToJson',
    'jsonToYaml',
    'yamlToJson',
    'jsonToXml',
    'xmlToJson',
    'dataDiff',
    'envToJson',
    'jsonToEnv',
    'iniToJson',
    'querystringToJson',
    'ndjsonToJson',
    'csvToExcel',
    'csvToHtml',
    'csvToMarkdown',
    'csvToSql',
    'csvToTsv',
    'tsvToCsv',
    'csvToXml',
    'csvToYaml',
    'textToCsv',
    'xmlToCsv',
    'sqlToCsv',
    'excelToCsv',
    'excelToJson',
    'htmlTableToJson',
    'htmlToMarkdown',
    'htmlToText',
    'htmlFormatter',
    'markdownToHtml',
    'markdownToRst',
    'markdownToSlack',
    'markdownToText',
    'textToHtml',
    'textToJson',
    'tomlToJson',
    'tomlToYaml',
    'xmlFormat',
    'xmlToJsonParser',
    'xmlToYaml',
    'xmlValidate',
    'yamlDiff',
    'yamlFormat',
    'yamlToProperties',
    'yamlToToml',
    'yamlValidate',
    'sqlToJson',
    'jsObjectToJson',
    'plistToJson',
    'protobufDecode'
  ] as const;

  const EXPECTED_ERRORS = [
    'DataTransformError',
    'CsvParseError',
    'YamlParseError',
    'XmlParseError',
    'DataConversionError',
    'DataDiffError',
    'InvalidInputError',
    'ValidationError',
    'SecurityError',
    'TomlParseError',
    'SqlParseError',
    'HtmlParseError',
    'ProtobufDecodeError',
    'JsObjectParseError',
    'IniParseError',
    'EnvParseError'
  ] as const;

  it('exports all 50 documented converter/utility functions', () => {
    for (const fnName of EXPECTED_FUNCTIONS) {
      expect(Toolkit, `Missing export: ${fnName}`).toHaveProperty(fnName);
      expect(typeof (Toolkit as any)[fnName], `Export ${fnName} should be a function`).toBe('function');
    }
    expect(EXPECTED_FUNCTIONS).toHaveLength(50);
  });

  it('exports all 16 error classes correctly', () => {
    for (const errName of EXPECTED_ERRORS) {
      expect(Toolkit, `Missing error class: ${errName}`).toHaveProperty(errName);
      const ErrClass = (Toolkit as any)[errName];
      expect(typeof ErrClass, `Export ${errName} should be a constructor`).toBe('function');

      const instance = errName === 'DataTransformError'
        ? new ErrClass(`Test ${errName}`, 'TEST_CODE')
        : new ErrClass(`Test ${errName}`);

      expect(instance).toBeInstanceOf(Error);
      expect(instance).toBeInstanceOf(Toolkit.DataTransformError);
      expect(instance.name).toBe(errName);
      expect(instance.message).toBe(`Test ${errName}`);
      expect(typeof instance.code).toBe('string');
      expect(typeof instance.toJSON).toBe('function');

      const json = instance.toJSON();
      expect(json.name).toBe(errName);
      expect(json.message).toBe(`Test ${errName}`);
      expect(json.code).toBe(instance.code);
    }
    expect(EXPECTED_ERRORS).toHaveLength(16);
  });

  it('error classes accept context and custom options properly', () => {
    const err = new Toolkit.CsvParseError('Bad CSV syntax', {
      line: 42,
      column: 7,
      context: { snippet: 'foo,"bar' }
    });

    expect(err.line).toBe(42);
    expect(err.column).toBe(7);
    expect(err.context).toEqual({
      snippet: 'foo,"bar',
      line: 42,
      column: 7
    });
    expect(err.code).toBe('CSV_PARSE_ERROR');

    const json = err.toJSON();
    expect(json.context.line).toBe(42);
    expect(json.context.column).toBe(7);
    expect(json.context.snippet).toBe('foo,"bar');
  });

  describe('Every utility handles execution with minimal valid inputs', () => {
    it('JSON <-> CSV', () => {
      expect(Toolkit.jsonToCsv([])).toBe('');
      expect(Toolkit.csvToJson('')).toEqual([]);
    });

    it('JSON <-> YAML', () => {
      expect(Toolkit.jsonToYaml({})).toBe('{}');
      expect(Toolkit.yamlToJson('{}')).toEqual({});
    });

    it('JSON <-> XML', () => {
      expect(Toolkit.jsonToXml({ root: '' })).toContain('<root');
      expect(Toolkit.xmlToJson('<root>val</root>')).toEqual({ root: 'val' });
    });

    it('Data Diff & YAML Diff', () => {
      const diffResult = Toolkit.dataDiff({ a: 1 }, { a: 1 });
      expect(diffResult.hasChanges).toBe(false);

      const yamlDiffResult = Toolkit.yamlDiff('a: 1', 'a: 1');
      expect(yamlDiffResult.hasChanges).toBe(false);
    });

    it('ENV & INI & QueryString & NDJSON', () => {
      expect(Toolkit.jsonToEnv({})).toBe('');
      expect(Toolkit.envToJson('')).toEqual({});
      expect(Toolkit.iniToJson('')).toEqual({});
      expect(Toolkit.querystringToJson('')).toEqual({});
      expect(Toolkit.ndjsonToJson('')).toEqual([]);
    });

    it('CSV Delimited Converters', () => {
      expect(Toolkit.csvToHtml('')).toBe('<table>\n  <tbody>\n  </tbody>\n</table>');
      expect(Toolkit.csvToMarkdown('')).toBe('');
      expect(Toolkit.csvToSql('', { tableName: 'items' })).toBe('');
      expect(Toolkit.csvToTsv('')).toBe('');
      expect(Toolkit.tsvToCsv('')).toBe('');
      expect(Toolkit.csvToXml('')).toBe('<root></root>');
      expect(Toolkit.csvToYaml('')).toBe('[]\n');
      expect(Toolkit.textToCsv('')).toBe('');
      expect(Toolkit.xmlToCsv('')).toBe('');
      expect(Toolkit.sqlToCsv('')).toBe('');
    });

    it('Excel Converters (Async)', async () => {
      const buf = await Toolkit.csvToExcel('a,b\n1,2');
      expect(Buffer.isBuffer(buf)).toBe(true);
      const json = await Toolkit.excelToJson(buf);
      expect(json).toHaveLength(1);
      const csv = await Toolkit.excelToCsv(buf);
      expect(csv).toContain('a,b');
    });

    it('HTML and Markdown Converters', () => {
      expect(Toolkit.htmlTableToJson('')).toEqual([]);
      expect(Toolkit.htmlToMarkdown('')).toBe('');
      expect(Toolkit.htmlToText('')).toBe('');
      expect(Toolkit.htmlFormatter('<div></div>')).toBe('<div>\n</div>');
      expect(Toolkit.markdownToHtml('')).toBe('');
      expect(Toolkit.markdownToRst('')).toBe('');
      expect(Toolkit.markdownToSlack('')).toBe('');
      expect(Toolkit.markdownToText('')).toBe('');
    });

    it('Text, TOML, and XML validation', () => {
      expect(Toolkit.textToHtml('')).toBe('');
      expect(Toolkit.textToJson('')).toEqual({});
      expect(Toolkit.tomlToJson('')).toEqual({});
      expect(Toolkit.tomlToYaml('')).toBe('{}');
      expect(Toolkit.xmlFormat('<r/>')).toBe('<r />');
      expect(Toolkit.xmlToJsonParser('<r>1</r>')).toEqual({ r: 1 });
      expect(Toolkit.xmlToYaml('<r>1</r>')).toBe('r: 1');
      expect(Toolkit.xmlValidate('<r>1</r>').valid).toBe(true);
    });

    it('YAML Utilities', () => {
      expect(Toolkit.yamlFormat('a: 1')).toBe('a: 1');
      expect(Toolkit.yamlToProperties('a: 1')).toBe('a=1');
      expect(Toolkit.yamlToToml('a: 1')).toBeDefined();
      expect(Toolkit.yamlValidate('a: 1').valid).toBe(true);
    });

    it('SQL & Specialized Converters', () => {
      expect(Toolkit.sqlToJson('')).toEqual([]);
      expect(Toolkit.jsObjectToJson('{}')).toBe('{}');
      expect(Toolkit.plistToJson('<?xml version="1.0" encoding="UTF-8"?><plist version="1.0"><dict></dict></plist>')).toEqual({});
      expect(Toolkit.protobufDecode(new Uint8Array([]))).toEqual([]);
    });
  });
});
