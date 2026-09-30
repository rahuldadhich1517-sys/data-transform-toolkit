import { describe, it, expect } from 'vitest';
import {
  jsonToCsv,
  csvToJson,
  jsonToYaml,
  yamlToJson,
  jsonToXml,
  xmlToJson,
  tomlToJson,
  tomlToYaml,
  yamlToToml,
  envToJson,
  jsonToEnv,
  iniToJson,
  querystringToJson,
  ndjsonToJson,
  csvToTsv,
  tsvToCsv,
  sqlToCsv,
  csvToExcel,
  excelToCsv,
  excelToJson,
  htmlFormatter,
  yamlFormat,
  xmlFormat,
  dataDiff,
  yamlDiff,
  xmlValidate,
  yamlValidate,
  markdownToHtml,
  SqlParseError,
  XmlParseError
} from '../index.js';

describe('Regression & Invariant Testing', () => {
  describe('Regression Bug Tests', () => {
    it('Regression 1: tomlToJson correctly parses inline tables containing commas in strings or arrays', () => {
      const toml = `
title = "Inline Table Test"
author = { name = "Doe, Jane", title = "Lead Architect, Engineering" }
config = { ports = [8080, 8443], debug = true }
`;
      const parsed = tomlToJson(toml);

      expect(parsed.title).toBe('Inline Table Test');
      expect(parsed.author).toEqual({
        name: 'Doe, Jane',
        title: 'Lead Architect, Engineering'
      });
      expect(parsed.config).toEqual({
        ports: [8080, 8443],
        debug: true
      });
    });

    it('Regression 2: jsonToCsv supports headers: false to omit header row', () => {
      const data = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' }
      ];

      const csvWithHeader = jsonToCsv(data, { headers: true });
      expect(csvWithHeader).toBe('id,name\n1,Alice\n2,Bob');

      const csvWithoutHeader = jsonToCsv(data, { headers: false });
      expect(csvWithoutHeader).toBe('1,Alice\n2,Bob');
      expect(csvWithoutHeader).not.toContain('id,name');
    });

    it('Regression 3: sqlToCsv supports hasHeader: false to omit header row', () => {
      const sql = "INSERT INTO users (id, name) VALUES (1, 'Alice'), (2, 'Bob');";

      const csvWithHeader = sqlToCsv(sql, { hasHeader: true });
      expect(csvWithHeader).toContain('id,name');

      const csvWithoutHeader = sqlToCsv(sql, { hasHeader: false });
      expect(csvWithoutHeader).not.toContain('id,name');
      expect(csvWithoutHeader).toBe('1,Alice\n2,Bob');
    });

    it('Regression 4: markdownToHtml parses markdown table with escaped pipes without splitting cell', () => {
      const markdown = `
| Command | Description |
| --- | --- |
| cat \\| grep | Pipe output \\| filter lines |
| ls | List files |
`;
      const html = markdownToHtml(markdown);

      expect(html).toContain('<table>');
      expect(html).toContain('<td>cat | grep</td>');
      expect(html).toContain('<td>Pipe output | filter lines</td>');
      expect(html).toContain('<td>ls</td>');
      expect(html).toContain('<td>List files</td>');
    });

    it('Regression 5: sqlToJson throws SqlParseError when VALUES has no tuples', () => {
      expect(() => sqlToCsv('INSERT INTO users VALUES')).toThrow(SqlParseError);
      expect(() => sqlToCsv('INSERT INTO users VALUES;')).toThrow(SqlParseError);
    });

    it('Regression 6: xmlFormat rejects non-well-formed unclosed XML tags', () => {
      expect(() => xmlFormat('<root><unclosed></root>')).toThrow(XmlParseError);
    });
  });

  describe('Property-Based / Invariant Tests', () => {
    describe('Formatter Idempotence', () => {
      it('htmlFormatter is idempotent: format(format(x)) === format(x)', () => {
        const dirtyHtml = '<div><p>Line 1</p><ul><li>Item 1</li><li>Item 2</li></ul></div>';
        const formattedOnce = htmlFormatter(dirtyHtml, { indent: 2 });
        const formattedTwice = htmlFormatter(formattedOnce, { indent: 2 });

        expect(formattedTwice).toBe(formattedOnce);
      });

      it('yamlFormat is idempotent: format(format(y)) === format(y)', () => {
        const dirtyYaml = `
app:
  name: toolkit
  version: 1.0.0
  features:
    - conversion
    - validation
`;
        const once = yamlFormat(dirtyYaml, { indentSize: 2 });
        const twice = yamlFormat(once, { indentSize: 2 });

        expect(twice).toBe(once);
      });

      it('xmlFormat is idempotent: format(format(x)) === format(x)', () => {
        const xml = '<root><user id="1"><name>Ada</name><role>Admin</role></user></root>';
        const once = xmlFormat(xml, { indent: 2 });
        const twice = xmlFormat(once, { indent: 2 });

        expect(twice).toBe(once);
      });
    });

    describe('Bidirectional Round-Trip Invariants', () => {
      it('CSV <-> JSON roundtrip preserves data records', () => {
        const initial = [
          { id: '1', name: 'Ada Lovelace', role: 'Mathematician' },
          { id: '2', name: 'Grace Hopper', role: 'Computer Scientist' }
        ];

        const csv = jsonToCsv(initial);
        const parsed = csvToJson(csv);

        expect(parsed).toEqual(initial);
      });

      it('YAML <-> JSON roundtrip preserves structured objects and arrays', () => {
        const initial = {
          database: {
            host: 'localhost',
            port: 5432,
            enabled: true,
            replicas: ['db1', 'db2']
          }
        };

        const yaml = jsonToYaml(initial);
        const parsed = yamlToJson(yaml);

        expect(parsed).toEqual(initial);
      });

      it('XML <-> JSON roundtrip preserves element structure', () => {
        const initial = {
          root: {
            title: 'Toolkit',
            count: 42
          }
        };

        const xml = jsonToXml(initial, { xmlDeclaration: false });
        const parsed = xmlToJson(xml);

        expect(parsed).toEqual(initial);
      });

      it('TOML <-> JSON roundtrip preserves table data', () => {
        const initial = {
          title: 'Config',
          owner: {
            name: 'Tom',
            active: true
          }
        };

        const toml = yamlToToml(jsonToYaml(initial));
        const parsed = tomlToJson(toml);

        expect(parsed.title).toBe('Config');
        expect(parsed.owner).toEqual({ name: 'Tom', active: true });
      });

      it('CSV <-> TSV roundtrip preserves tabular structure', () => {
        const csv = 'id,name,city\n1,Alice,London\n2,Bob,Paris';
        const tsv = csvToTsv(csv);
        const csvBack = tsvToCsv(tsv);

        expect(csvBack).toBe(csv);
      });

      it('ENV <-> JSON roundtrip preserves key-value pairs', () => {
        const envObj = {
          API_KEY: 'secret123',
          HOST: '127.0.0.1',
          PORT: '8080'
        };

        const envText = jsonToEnv(envObj);
        const parsed = envToJson(envText);

        expect(parsed).toEqual(envObj);
      });

      it('Querystring <-> JSON preserves parameters', () => {
        const qs = 'category=books&limit=20&page=1';
        const json = querystringToJson(qs);
        expect(json).toEqual({ category: 'books', limit: '20', page: '1' });
      });

      it('Excel buffer <-> CSV roundtrip preserves data cells', async () => {
        const initialCsv = 'id,product,price\n1,Laptop,999\n2,Mouse,25';
        const xlsxBuf = await csvToExcel(initialCsv);
        const csvExtracted = await excelToCsv(xlsxBuf);

        expect(csvExtracted).toBe(initialCsv);

        const jsonExtracted = await excelToJson(xlsxBuf);
        expect(jsonExtracted).toEqual([
          { id: 1, product: 'Laptop', price: 999 },
          { id: 2, product: 'Mouse', price: 25 }
        ]);
      });
    });

    describe('DataDiff Mathematical Invariants', () => {
      const objA = { a: 1, b: 'two', c: [1, 2], d: { nested: true } };
      const objB = { a: 1, b: 'three', c: [1, 2, 3], e: 'new' };

      it('Identity: diffing an object with itself produces hasChanges: false', () => {
        const diff = dataDiff(objA, objA);
        expect(diff.hasChanges).toBe(false);
        expect(diff.added).toHaveLength(0);
        expect(diff.removed).toHaveLength(0);
        expect(diff.changed).toHaveLength(0);
        expect(diff.summary.totalChanges).toBe(0);
      });

      it('Symmetry: diff(A, B).hasChanges === diff(B, A).hasChanges', () => {
        const diffAB = dataDiff(objA, objB);
        const diffBA = dataDiff(objB, objA);

        expect(diffAB.hasChanges).toBe(true);
        expect(diffBA.hasChanges).toBe(true);
        expect(diffAB.hasChanges).toBe(diffBA.hasChanges);
      });

      it('Inversion: added in diff(A, B) equals removed in diff(B, A)', () => {
        const diffAB = dataDiff(objA, objB);
        const diffBA = dataDiff(objB, objA);

        expect(diffAB.added.length).toBe(diffBA.removed.length);
        expect(diffAB.removed.length).toBe(diffBA.added.length);
      });

      it('yamlDiff identity invariant holds', () => {
        const yaml = 'name: toolkit\nversion: 1.0.0\n';
        const diff = yamlDiff(yaml, yaml);
        expect(diff.hasChanges).toBe(false);
      });
    });

    describe('Validation Consistency Invariants', () => {
      it('xmlValidate consistently classifies valid and invalid XML', () => {
        const validXml = '<?xml version="1.0"?><catalog><book id="1"><title>Clean Code</title></book></catalog>';
        const vRes = xmlValidate(validXml);
        expect(vRes.valid).toBe(true);
        expect(vRes.errors).toHaveLength(0);

        const invalidXml = '<catalog><book id="1"><title>Clean Code</book></catalog>';
        const invRes = xmlValidate(invalidXml);
        expect(invRes.valid).toBe(false);
        expect(invRes.errors.length).toBeGreaterThan(0);
      });

      it('yamlValidate consistently classifies valid and invalid YAML', () => {
        const validYaml = 'app:\n  port: 8080\n  debug: false';
        const vRes = yamlValidate(validYaml);
        expect(vRes.valid).toBe(true);
        expect(vRes.errors).toHaveLength(0);

        const invalidYaml = 'app:\n      port: 8080\n  debug: false';
        const invRes = yamlValidate(invalidYaml, { strict: true });
        expect(invRes.valid).toBe(false);
        expect(invRes.errors.length).toBeGreaterThan(0);
      });
    });
  });
});
