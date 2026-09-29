import { describe, it, expect } from 'vitest';
import {
  csvToHtml,
  csvToMarkdown,
  csvToSql,
  csvToTsv,
  tsvToCsv,
  csvToXml,
  csvToYaml,
  textToCsv,
  sqlToCsv,
  xmlToCsv
} from '../index.js';

describe('CSV Extended Converters', () => {
  const sampleCsv = `id,name,age\n1,Rahul,23\n2,Amit,25`;

  it('csvToHtml creates semantic table with escaping', () => {
    const html = csvToHtml('name,status\n<b>Bob</b>,OK & Valid', { tableClass: 'table-striped' });
    expect(html).toContain('<table class="table-striped">');
    expect(html).toContain('<thead>');
    expect(html).toContain('<th>name</th>');
    expect(html).toContain('<td>&lt;b&gt;Bob&lt;/b&gt;</td>');
    expect(html).toContain('<td>OK &amp; Valid</td>');
  });

  it('csvToMarkdown creates markdown table with alignment', () => {
    const md = csvToMarkdown(sampleCsv, { alignment: 'center' });
    expect(md).toContain('| id  | name  | age |');
    expect(md).toContain(':---:');
    expect(md).toContain('| 1   | Rahul | 23  |');
  });

  it('csvToMarkdown escapes pipe characters', () => {
    const csv = 'key,val\na,b|c';
    const md = csvToMarkdown(csv);
    expect(md).toContain('b\\|c');
  });

  it('csvToSql generates valid INSERT statements safely', () => {
    const sql = csvToSql(sampleCsv, { tableName: 'users' });
    expect(sql).toContain('INSERT INTO users (id, name, age) VALUES');
    expect(sql).toContain("(1, 'Rahul', 23),");
    expect(sql).toContain("(2, 'Amit', 25);");
  });

  it('csvToSql handles quotes and NULL correctly', () => {
    const csv = "id,note\n1,O'Connor\n2,NULL";
    const sql = csvToSql(csv, { tableName: 'notes' });
    expect(sql).toContain("(1, 'O''Connor'),");
    expect(sql).toContain('(2, NULL);');
  });

  it('csvToTsv and tsvToCsv roundtrip correctly', () => {
    const tsv = csvToTsv(sampleCsv);
    expect(tsv).toBe('id\tname\tage\n1\tRahul\t23\n2\tAmit\t25');

    const csvBack = tsvToCsv(tsv);
    expect(csvBack).toBe(sampleCsv);
  });

  it('csvToXml generates XML with sanitized tags', () => {
    const xml = csvToXml(sampleCsv, { rootElement: 'users', rowElement: 'user' });
    expect(xml).toContain('<users>');
    expect(xml).toContain('<user>');
    expect(xml).toContain('<id>1</id>');
    expect(xml).toContain('<name>Rahul</name>');
    expect(xml).toContain('</users>');
  });

  it('csvToYaml converts CSV to YAML', () => {
    const yaml = csvToYaml(sampleCsv);
    expect(yaml).toContain('name: Rahul');
    expect(yaml).toContain('age: 23');
  });

  it('textToCsv parses tab and pipe delimited text', () => {
    const pipeText = 'id|name\n1|Alice\n2|Bob';
    const csv = textToCsv(pipeText);
    expect(csv).toBe('id,name\n1,Alice\n2,Bob');
  });

  it('sqlToCsv parses INSERT statement into CSV', () => {
    const sql = "INSERT INTO users (id, name) VALUES (1, 'Rahul'), (2, 'Amit');";
    const csv = sqlToCsv(sql);
    expect(csv).toBe('id,name\n1,Rahul\n2,Amit');
  });

  it('xmlToCsv flattens XML records into CSV', () => {
    const xml = `
<users>
  <user>
    <id>1</id>
    <name>Rahul</name>
  </user>
  <user>
    <id>2</id>
    <name>Amit</name>
  </user>
</users>`;
    const csv = xmlToCsv(xml);
    expect(csv).toContain('id,name');
    expect(csv).toContain('1,Rahul');
    expect(csv).toContain('2,Amit');
  });
});
