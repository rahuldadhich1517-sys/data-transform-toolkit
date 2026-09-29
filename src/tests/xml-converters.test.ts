import { describe, it, expect } from 'vitest';
import {
  xmlFormat,
  xmlToJsonParser,
  xmlToYaml,
  xmlValidate
} from '../index.js';

describe('XML Extended Converters', () => {
  const sampleXml = '<root><user id="1"><name>Rahul</name></user></root>';

  it('xmlFormat pretty-prints XML with proper indentation', () => {
    const formatted = xmlFormat(sampleXml, { indent: 2 });
    expect(formatted).toContain('<root>');
    expect(formatted).toContain('  <user id="1">');
    expect(formatted).toContain('    <name>Rahul</name>');
    expect(formatted).toContain('  </user>');
    expect(formatted).toContain('</root>');
  });

  it('xmlToJsonParser parses XML into structured JSON with options', () => {
    const parsed = xmlToJsonParser(sampleXml, { attributePrefix: '$', parseNumbers: true });
    expect(parsed).toEqual({
      root: {
        user: {
          $id: 1,
          name: 'Rahul'
        }
      }
    });
  });

  it('xmlToYaml converts XML to YAML format', () => {
    const yaml = xmlToYaml(sampleXml);
    expect(yaml).toContain('name: Rahul');
  });

  it('xmlValidate returns validation result with line/column for malformed XML', () => {
    const validResult = xmlValidate(sampleXml);
    expect(validResult.valid).toBe(true);
    expect(validResult.errors.length).toBe(0);

    const invalidResult = xmlValidate('<root><unclosed></root>');
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors.length).toBeGreaterThan(0);
  });
});
