import { describe, it, expect } from 'vitest';
import {
  csvToJson,
  jsonToCsv,
  ndjsonToJson,
  csvToExcel,
  excelToJson,
  excelToCsv,
  jsonToXml,
  xmlToJson,
  xmlFormat,
  jsonToYaml,
  yamlToJson,
  yamlToToml,
  tomlToJson,
  tomlToYaml,
  csvToMarkdown,
  markdownToHtml,
  markdownToText,
  csvToHtml,
  htmlTableToJson,
  htmlToText,
  textToHtml,
  textToCsv,
  textToJson,
  csvToSql,
  sqlToCsv,
  sqlToJson,
  csvToTsv,
  tsvToCsv,
  csvToXml,
  xmlToCsv,
  csvToYaml,
  xmlToYaml,
  jsonToEnv,
  envToJson,
  iniToJson,
  plistToJson,
  querystringToJson,
  dataDiff,
  yamlDiff
} from '../index.js';

describe('Large Input, Stress, and Internationalization Testing', () => {
  describe('High Volume Datasets', () => {
    it('handles 2,500 CSV rows without memory or performance issues', () => {
      const headers = 'id,name,role,department,salary,active\n';
      const rows: string[] = [];
      for (let i = 1; i <= 2500; i++) {
        rows.push(`${i},"Employee, User ${i}",Developer,Engineering,${50000 + i},true`);
      }
      const csv = headers + rows.join('\n');

      const start = performance.now();
      const json = csvToJson(csv);
      const elapsedParse = performance.now() - start;

      expect(json).toHaveLength(2500);
      expect(json[0]).toEqual({
        id: '1',
        name: 'Employee, User 1',
        role: 'Developer',
        department: 'Engineering',
        salary: '50001',
        active: 'true'
      });
      expect(json[2499]?.['id']).toBe('2500');
      expect(elapsedParse).toBeLessThan(2000); // Under 2s

      // Roundtrip serialize back
      const serializedCsv = jsonToCsv(json);
      expect(serializedCsv.split('\n')).toHaveLength(2501);
    });

    it('handles 5,000 NDJSON records efficiently', () => {
      const records: string[] = [];
      for (let i = 0; i < 5000; i++) {
        records.push(JSON.stringify({ eventId: i, type: 'click', timestamp: 1700000000 + i }));
      }
      const ndjson = records.join('\n');

      const parsed = ndjsonToJson(ndjson);
      expect(parsed).toHaveLength(5000);
      expect(parsed[4999]?.['eventId']).toBe(4999);
    });

    it('handles 1,000 rows in Excel conversion (Buffer)', async () => {
      const rows: string[] = ['rowId,label,amount,inStock'];
      for (let i = 1; i <= 1000; i++) {
        rows.push(`${i},Item #${i},${i * 2.5},${i % 2 === 0}`);
      }
      const csv = rows.join('\n');

      const buffer = await csvToExcel(csv, { sheetName: 'BulkData' });
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(1000);

      const recoveredJson = await excelToJson(buffer, { sheet: 'BulkData' });
      expect(recoveredJson).toHaveLength(1000);
      expect(recoveredJson[0]?.['rowId']).toBe(1);
      expect(recoveredJson[999]?.['rowId']).toBe(1000);
      expect(recoveredJson[999]?.['amount']).toBe(2500);

      const recoveredCsv = await excelToCsv(buffer, { sheet: 'BulkData' });
      expect(recoveredCsv.trim().split('\n')).toHaveLength(1001);
    });

    it('handles objects with 1,000 keys in JSON, YAML, TOML, and INI', () => {
      const largeObj: Record<string, number> = {};
      const iniLines: string[] = [];
      for (let i = 0; i < 1000; i++) {
        largeObj[`key_${i}`] = i;
        iniLines.push(`key_${i} = ${i}`);
      }

      // JSON to YAML
      const yaml = jsonToYaml(largeObj);
      const parsedYaml = yamlToJson(yaml) as Record<string, number>;
      expect(Object.keys(parsedYaml)).toHaveLength(1000);
      expect(parsedYaml['key_999']).toBe(999);

      // YAML to TOML and TOML to JSON
      const toml = yamlToToml(yaml);
      const parsedToml = tomlToJson(toml) as Record<string, number>;
      expect(Object.keys(parsedToml)).toHaveLength(1000);
      expect(parsedToml['key_999']).toBe(999);

      // INI to JSON
      const parsedIni = iniToJson(iniLines.join('\n'), { parsePrimitives: true }) as Record<string, number>;
      expect(Object.keys(parsedIni)).toHaveLength(1000);
      expect(parsedIni['key_999']).toBe(999);
    });

    it('handles large diffs with 1,000 array elements', () => {
      const arrayA = Array.from({ length: 1000 }, (_, i) => ({ id: i, val: i }));
      const arrayB = Array.from({ length: 1000 }, (_, i) => ({ id: i, val: i % 10 === 0 ? i + 1 : i }));

      const diff = dataDiff(arrayA, arrayB);
      expect(diff.hasChanges).toBe(true);
      expect(diff.summary.totalChanged).toBe(100);
    });
  });

  describe('Deep Nesting Boundaries', () => {
    it('handles nesting up to 25 levels within default maxDepth without stack overflow', () => {
      let nestedObj: Record<string, unknown> = { leaf: 'deepValue' };
      for (let i = 24; i >= 1; i--) {
        nestedObj = { [`level_${i}`]: nestedObj };
      }

      // YAML serialize & parse
      const yaml = jsonToYaml(nestedObj);
      const parsedYaml = yamlToJson(yaml) as Record<string, unknown>;
      let current: any = parsedYaml;
      for (let i = 1; i <= 24; i++) {
        expect(current).toHaveProperty(`level_${i}`);
        current = current[`level_${i}`];
      }
      expect(current.leaf).toBe('deepValue');

      // XML serialize & parse
      const xml = jsonToXml({ root: nestedObj });
      const parsedXml = xmlToJson(xml) as any;
      expect(parsedXml.root).toBeDefined();

      // Plist parse
      const plistXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>level1</key>
  <dict>
    <key>level2</key>
    <dict>
      <key>val</key>
      <string>deep</string>
    </dict>
  </dict>
</dict>
</plist>`;
      const parsedPlist = plistToJson(plistXml) as any;
      expect(parsedPlist.level1.level2.val).toBe('deep');
    });
  });

  describe('Unicode, Multilingual & Special Character Handling', () => {
    const multilingualSample = {
      japanese: 'こんにちは世界 - 日本語のテストです。',
      arabic: 'مرحبا بالعالم - هذا اختبار للغة العربية',
      chinese: '你好，世界！这是一次测试。',
      cyrillic: 'Привет, мир! Это тестовая строка.',
      hindi: 'नमस्ते दुनिया! यह एक परीक्षण है।',
      greek: 'Γειά σου Κόσμε! Αυτή είναι μια δοκιμή.',
      hebrew: 'שלום עולם! זוהי בדיקה.',
      accents: 'Café, naïve, façade, crème brûlée, Übergrößen träger',
      emojis: '🚀 🎉 🦄 💻 ⚡ 🔥 ✨ 🌍 🤖 📦',
      combinedGraphemes: '👨‍👩‍👧‍👦 🏳️‍🌈 e\u0301 (é composed)',
      symbols: '© ® ™ § ¶ † ‡ • … ‰ ′ ″ ※ ℵ ℶ',
      currencies: '$ € £ ¥ ₹ ₽ ₩ ₪ ₫ ฿ ₺ ₴',
      mathSymbols: '∑ ∏ √ ∫ ≈ ≠ ≤ ≥ ± ∞'
    };

    it('preserves all multilingual Unicode strings across JSON <-> YAML', () => {
      const yaml = jsonToYaml(multilingualSample);
      const parsed = yamlToJson(yaml);
      expect(parsed).toEqual(multilingualSample);
    });

    it('preserves multilingual Unicode in CSV serialization and parsing', () => {
      const rows = [
        { lang: 'Japanese', text: multilingualSample.japanese },
        { lang: 'Arabic', text: multilingualSample.arabic },
        { lang: 'Emojis', text: multilingualSample.emojis },
        { lang: 'Accents', text: multilingualSample.accents }
      ];
      const csv = jsonToCsv(rows);
      const parsed = csvToJson(csv);
      expect(parsed).toEqual(rows);
    });

    it('preserves multilingual Unicode in XML serialization, formatting and parsing', () => {
      const xml = jsonToXml({ root: multilingualSample });
      const formatted = xmlFormat(xml);
      const parsed = xmlToJson(formatted) as any;
      expect(parsed.root.japanese).toBe(multilingualSample.japanese);
      expect(parsed.root.arabic).toBe(multilingualSample.arabic);
      expect(parsed.root.emojis).toBe(multilingualSample.emojis);
      expect(parsed.root.accents).toBe(multilingualSample.accents);
    });

    it('preserves multilingual Unicode in TOML serialization and parsing via YAML bridge', () => {
      const yaml = jsonToYaml(multilingualSample);
      const toml = yamlToToml(yaml);
      const parsed = tomlToJson(toml);
      expect(parsed).toEqual(multilingualSample);
    });

    it('preserves multilingual Unicode in CSV to Markdown table and Markdown to Text', () => {
      const csv = 'language,greeting\nJapanese,こんにちは\nRussian,Привет\nHindi,नमस्ते\nEmoji,👋';
      const md = csvToMarkdown(csv);
      const text = markdownToText(md);
      expect(text).toContain('こんにちは');
      expect(text).toContain('Привет');
      expect(text).toContain('नमस्ते');
      expect(text).toContain('👋');
    });

    it('preserves multilingual Unicode in CSV to HTML table and HTML table to JSON', () => {
      const csv = 'id,name,note\n1,François & René,spécialité française\n2,太郎,こんにちは';
      const html = csvToHtml(csv);
      const parsed = htmlTableToJson(html);
      expect(parsed[0]?.['name']).toBe('François & René');
      expect(parsed[0]?.['note']).toBe('spécialité française');
      expect(parsed[1]?.['name']).toBe('太郎');
      expect(parsed[1]?.['note']).toBe('こんにちは');
    });

    it('preserves multilingual Unicode in CSV to SQL and SQL to JSON', () => {
      const csv = 'id,user,status\n1,José Müller,ativo ✓\n2,علي أحمد,مكتمل';
      const sql = csvToSql(csv, { tableName: 'users' });
      const parsed = sqlToJson(sql);
      expect(parsed).toEqual([
        { id: 1, user: 'José Müller', status: 'ativo ✓' },
        { id: 2, user: 'علي أحمد', status: 'مكتمل' }
      ]);
    });

    it('preserves Unicode in QueryString parsing', () => {
      const qs = 'search=caf%C3%A9%20%26%20tea&author=Ren%C3%A9&tag=%E6%97%A5%E6%9C%AC%E8%AA%9E';
      const parsed = querystringToJson(qs);
      expect(parsed).toEqual({
        search: 'café & tea',
        author: 'René',
        tag: '日本語'
      });
    });

    it('preserves Unicode in Text and INI parsing', () => {
      const ini = 'user = André\nnotes = Trés bien!';
      const parsed = iniToJson(ini);
      expect(parsed).toEqual({
        user: 'André',
        notes: 'Trés bien!'
      });
    });
  });

  describe('Edge-case string characters and delimiters', () => {
    it('handles keys with periods, spaces, colons, quotes and slashes in YAML', () => {
      const weirdKeys = {
        'a.b.c': 'dot key',
        'key with spaces': 'space val',
        'colon:key': 'colon val',
        'quote"key': 'quote val',
        'path/to/thing': 'slash val'
      };

      const yaml = jsonToYaml(weirdKeys);
      const parsedYaml = yamlToJson(yaml);
      expect(parsedYaml).toEqual(weirdKeys);

      const qs = 'a.b.c=dot%20key&key+with+spaces=space+val';
      const parsedQs = querystringToJson(qs);
      expect(parsedQs['a.b.c']).toBe('dot key');
      expect(parsedQs['key with spaces']).toBe('space val');
    });

    it('correctly reports differences between complex YAML strings with yamlDiff', () => {
      const yamlA = 'name: John\nage: 30\nskills:\n  - ts\n  - js';
      const yamlB = 'name: John\nage: 31\nskills:\n  - ts\n  - python';

      const diff = yamlDiff(yamlA, yamlB);
      expect(diff.hasChanges).toBe(true);
      expect(diff.summary.totalChanged).toBe(2); // age changed, array element changed
    });
  });
});
