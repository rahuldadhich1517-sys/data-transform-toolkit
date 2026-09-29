import { describe, it, expect } from 'vitest';
import {
  csvToJson,
  jsonToCsv,
  csvToYaml,
  yamlToJson,
  csvToXml,
  xmlToJson,
  jsonToYaml,
  tomlToJson,
  yamlToToml,
  xmlToYaml,
  sqlToJson,
  markdownToHtml,
  htmlToText
} from '../index.js';

describe('Cross-Utility Round-Trip Testing', () => {
  it('CSV -> JSON -> CSV roundtrip', () => {
    const originalCsv = 'id,name,role\n1,Alice,Engineer\n2,Bob,Manager';
    const json = csvToJson(originalCsv);
    const csvBack = jsonToCsv(json);
    expect(csvBack).toBe(originalCsv);
  });

  it('CSV -> YAML -> JSON pipeline', () => {
    const csv = 'key,val\na,1\nb,2';
    const yaml = csvToYaml(csv);
    const json = yamlToJson(yaml) as Array<{ key: string; val: number }>;
    expect(json).toEqual([
      { key: 'a', val: 1 },
      { key: 'b', val: 2 }
    ]);
  });

  it('CSV -> XML -> JSON pipeline', () => {
    const csv = 'name,status\nAlice,Active';
    const xml = csvToXml(csv, { rootElement: 'data', rowElement: 'item' });
    const json = xmlToJson(xml) as { data: { item: { name: string; status: string } } };
    expect(json.data.item.name).toBe('Alice');
    expect(json.data.item.status).toBe('Active');
  });

  it('JSON -> YAML -> JSON roundtrip', () => {
    const obj = { server: { host: 'localhost', port: 8080 }, active: true };
    const yaml = jsonToYaml(obj);
    const back = yamlToJson(yaml);
    expect(back).toEqual(obj);
  });

  it('TOML -> JSON -> TOML roundtrip', () => {
    const toml = 'title = "Config"\n\n[database]\nhost = "127.0.0.1"\nport = 5432\n';
    const json = tomlToJson(toml);
    const yaml = jsonToYaml(json);
    const tomlBack = yamlToToml(yaml);
    expect(tomlBack).toContain('title = "Config"');
    expect(tomlBack).toContain('host = "127.0.0.1"');
    expect(tomlBack).toContain('port = 5432');
  });

  it('YAML -> JSON -> YAML roundtrip', () => {
    const originalYaml = 'app: Test\nenabled: true\ncount: 5\n';
    const json = yamlToJson(originalYaml) as Record<string, unknown>;
    const yamlBack = jsonToYaml(json);
    const backJson = yamlToJson(yamlBack);
    expect(backJson).toEqual(json);
  });

  it('Markdown -> HTML -> Text pipeline', () => {
    const md = '# Introduction\n\nThis is a **bold** paragraph with a [link](https://example.com).';
    const html = markdownToHtml(md);
    const text = htmlToText(html);
    expect(text).toContain('Introduction');
    expect(text).toContain('This is a bold paragraph with a link.');
  });

  it('XML -> JSON -> YAML pipeline', () => {
    const xml = '<service><name>Auth</name><port>4000</port></service>';
    const yaml = xmlToYaml(xml);
    const json = yamlToJson(yaml) as { service: { name: string; port: number } };
    expect(json.service.name).toBe('Auth');
    expect(json.service.port).toBe(4000);
  });

  it('SQL -> JSON -> CSV pipeline', () => {
    const sql = "INSERT INTO members (id, email) VALUES (1, 'alice@test.com'), (2, 'bob@test.com');";
    const json = sqlToJson(sql);
    const csv = jsonToCsv(json);
    expect(csv).toBe('id,email\n1,alice@test.com\n2,bob@test.com');
  });
});
