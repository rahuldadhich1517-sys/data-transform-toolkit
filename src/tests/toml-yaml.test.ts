import { describe, it, expect } from 'vitest';
import {
  tomlToJson,
  tomlToYaml,
  yamlDiff,
  yamlFormat,
  yamlToProperties,
  yamlToToml,
  yamlValidate
} from '../index.js';

describe('TOML and YAML Converters', () => {
  it('tomlToJson converts valid TOML', () => {
    const toml = `
title = "TOML Example"

[owner]
name = "Tom Preston-Werner"
`;
    const json = tomlToJson(toml);
    expect(json).toEqual({
      title: 'TOML Example',
      owner: {
        name: 'Tom Preston-Werner'
      }
    });
  });

  it('tomlToYaml converts TOML to YAML', () => {
    const toml = 'name = "Toolkit"\nversion = "1.0.0"';
    const yaml = tomlToYaml(toml);
    expect(yaml).toContain('name: Toolkit');
    expect(yaml).toContain('version: 1.0.0');
  });

  it('yamlDiff compares two YAML documents structurally', () => {
    const orig = 'host: localhost\nport: 5432';
    const mod = 'host: localhost\nport: 5433\nuser: postgres';
    const diff = yamlDiff(orig, mod);

    expect(diff.hasChanges).toBe(true);
    expect(diff.changed.some(c => c.path === 'port')).toBe(true);
    expect(diff.added.some(a => a.path === 'user')).toBe(true);
  });

  it('yamlFormat normalizes YAML structure', () => {
    const yaml = 'b: 2\na: 1';
    const formatted = yamlFormat(yaml, { indentSize: 2 });
    expect(formatted).toContain('b: 2');
    expect(formatted).toContain('a: 1');
  });

  it('yamlToProperties converts YAML into .properties format', () => {
    const yaml = `
database:
  host: localhost
  port: 5432
`;
    const props = yamlToProperties(yaml);
    expect(props).toContain('database.host=localhost');
    expect(props).toContain('database.port=5432');
  });

  it('yamlToToml converts YAML object to TOML', () => {
    const yaml = `
app:
  title: TestApp
  port: 8080
`;
    const toml = yamlToToml(yaml);
    expect(toml).toContain('[app]');
    expect(toml).toContain('title = "TestApp"');
    expect(toml).toContain('port = 8080');
  });

  it('yamlValidate returns validation results with line/column for errors', () => {
    const valid = yamlValidate('name: Test\nitems:\n  - 1\n  - 2');
    expect(valid.valid).toBe(true);
    expect(valid.errors.length).toBe(0);

    const invalid = yamlValidate('key: "unclosed string');
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.length).toBeGreaterThan(0);
  });
});
