import { describe, it, expect } from 'vitest';
import { csvToExcel, excelToCsv, excelToJson } from '../index.js';

describe('Excel Converters', () => {
  it('converts CSV to Excel and reads back via excelToCsv', async () => {
    const csv = 'id,name,active\n1,Alice,true\n2,Bob,false';
    const buffer = await csvToExcel(csv, { sheetName: 'Sheet1' });
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(100);

    const csvOut = await excelToCsv(buffer, { sheet: 1 });
    expect(csvOut).toContain('id,name,active');
    expect(csvOut).toContain('1,Alice,true');
    expect(csvOut).toContain('2,Bob,false');
  });

  it('converts Excel workbook to JSON records via excelToJson', async () => {
    const csv = 'name,score\nCharlie,95.5\nDavid,80';
    const buffer = await csvToExcel(csv);

    const json = await excelToJson(buffer);
    expect(json).toEqual([
      { name: 'Charlie', score: 95.5 },
      { name: 'David', score: 80 }
    ]);
  });

  it('handles empty cells gracefully', async () => {
    const csv = 'a,b\n1,\n,2';
    const buffer = await csvToExcel(csv);
    const json = await excelToJson(buffer);
    expect(json[0]!.b).toBeNull();
    expect(json[1]!.a).toBeNull();
  });
});
