import { describe, it, expect } from 'vitest';
import { csvToJson, jsonToCsv, CsvParseError } from '../index';

describe('CSV Converters', () => {
  describe('csvToJson', () => {
    it('should parse basic CSV', () => {
      const csv = 'name,age,city\nRahul,25,Jaipur\nAmit,26,Delhi';
      const result = csvToJson(csv);

      expect(result).toEqual([
        { name: 'Rahul', age: '25', city: 'Jaipur' },
        { name: 'Amit', age: '26', city: 'Delhi' }
      ]);
    });

    it('should handle quoted values', () => {
      const csv = 'name,description\n"Rahul","Hello, World"';
      const result = csvToJson(csv);

      expect(result[0].description).toBe('Hello, World');
    });

    it('should handle escaped quotes', () => {
      const csv = 'name,quote\n"Rahul","He said ""Hello"""';
      const result = csvToJson(csv);

      expect(result[0].quote).toBe('He said "Hello"');
    });

    it('should handle newlines in quoted fields', () => {
      const csv = 'name,description\n"Rahul","Line 1\nLine 2"';
      const result = csvToJson(csv);

      expect(result[0].description).toBe('Line 1\nLine 2');
    });

    it('should handle empty fields', () => {
      const csv = 'name,age,city\nRahul,,Jaipur';
      const result = csvToJson(csv);

      expect(result[0]).toEqual({
        name: 'Rahul',
        age: null,
        city: 'Jaipur'
      });
    });

    it('should handle missing fields', () => {
      const csv = 'name,age,city\nRahul,25';
      const result = csvToJson(csv);

      expect(result[0]).toEqual({
        name: 'Rahul',
        age: '25',
        city: null
      });
    });

    it('should handle custom delimiter', () => {
      const csv = 'name;age;city\nRahul;25;Jaipur';
      const result = csvToJson(csv, { delimiter: ';' });

      expect(result[0]).toEqual({
        name: 'Rahul',
        age: '25',
        city: 'Jaipur'
      });
    });

    it('should handle trim option', () => {
      const csv = 'name,age,city\n Rahul , 25 , Jaipur ';
      const result = csvToJson(csv, { trim: true });

      expect(result[0]).toEqual({
        name: 'Rahul',
        age: '25',
        city: 'Jaipur'
      });
    });

    it('should handle empty CSV', () => {
      const result = csvToJson('');
      expect(result).toEqual([]);
    });

    it('should handle CRLF line endings', () => {
      const csv = 'name,age\r\nRahul,25\r\nAmit,26';
      const result = csvToJson(csv);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Rahul');
      expect(result[1].name).toBe('Amit');
    });
  });

  describe('jsonToCsv', () => {
    it('should serialize basic objects', () => {
      const data = [
        { name: 'Rahul', age: 25, city: 'Jaipur' },
        { name: 'Amit', age: 26, city: 'Delhi' }
      ];
      const csv = jsonToCsv(data);

      expect(csv).toContain('name,age,city');
      expect(csv).toContain('Rahul,25,Jaipur');
      expect(csv).toContain('Amit,26,Delhi');
    });

    it('should escape commas in values', () => {
      const data = [{ name: 'Rahul', description: 'Hello, World' }];
      const csv = jsonToCsv(data);

      expect(csv).toContain('"Hello, World"');
    });

    it('should escape quotes in values', () => {
      const data = [{ name: 'Rahul', quote: 'He said "Hello"' }];
      const csv = jsonToCsv(data);

      expect(csv).toContain('"He said ""Hello"""');
    });

    it('should handle empty array', () => {
      const csv = jsonToCsv([]);
      expect(csv).toBe('');
    });

    it('should handle null values', () => {
      const data = [{ name: 'Rahul', age: null, city: 'Jaipur' }];
      const csv = jsonToCsv(data);

      expect(csv).toContain('Rahul,,Jaipur');
    });

    it('should handle boolean values', () => {
      const data = [{ name: 'Rahul', active: true, deleted: false }];
      const csv = jsonToCsv(data);

      expect(csv).toContain('true');
      expect(csv).toContain('false');
    });

    it('should handle custom delimiter', () => {
      const data = [{ name: 'Rahul', age: 25 }];
      const csv = jsonToCsv(data, { delimiter: ';' });

      expect(csv).toContain('name;age');
      expect(csv).toContain('Rahul;25');
    });

    it('should handle arrays in values', () => {
      const data = [{ name: 'Rahul', skills: ['React', 'Node.js'] }];
      const csv = jsonToCsv(data);

      expect(csv).toContain('Rahul');
      expect(csv).toContain('React');
      expect(csv).toContain('Node.js');
    });
  });

  describe('Round-trip CSV', () => {
    it('should convert JSON to CSV and back', () => {
      const original = [
        { name: 'Rahul', age: '25', city: 'Jaipur' },
        { name: 'Amit', age: '26', city: 'Delhi' }
      ];

      const csv = jsonToCsv(original);
      const parsed = csvToJson(csv);

      expect(parsed).toEqual(original);
    });

    it('should handle round-trip with quoted values', () => {
      const original = [
        { name: 'Rahul', description: 'Hello, World' }
      ];

      const csv = jsonToCsv(original);
      const parsed = csvToJson(csv);

      expect(parsed[0].description).toBe('Hello, World');
    });
  });

  describe('Error handling', () => {
    it('should throw on invalid input type to csvToJson', () => {
      expect(() => {
        csvToJson(123 as any);
      }).toThrow(CsvParseError);
    });

    it('should handle malformed CSV with unclosed quotes', () => {
      const csv = 'name,description\nRahul,"unclosed quote';
      // Should not throw in non-strict mode, but might contain unclosed quote
      const result = csvToJson(csv);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
