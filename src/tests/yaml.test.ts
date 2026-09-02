import { describe, it, expect } from 'vitest';
import { jsonToYaml, yamlToJson } from '../index';

describe('YAML Converters', () => {
  describe('jsonToYaml', () => {
    it('should serialize basic objects', () => {
      const data = { name: 'Rahul', age: 25, city: 'Jaipur' };
      const yaml = jsonToYaml(data);

      expect(yaml).toContain('name: Rahul');
      expect(yaml).toContain('age: 25');
      expect(yaml).toContain('city: Jaipur');
    });

    it('should serialize arrays', () => {
      const data = { skills: ['React', 'Node.js', 'TypeScript'] };
      const yaml = jsonToYaml(data);

      expect(yaml).toContain('skills:');
      expect(yaml).toContain('- React');
      expect(yaml).toContain('- Node.js');
      expect(yaml).toContain('- TypeScript');
    });

    it('should serialize nested objects', () => {
      const data = {
        user: {
          name: 'Rahul',
          address: {
            city: 'Jaipur',
            country: 'India'
          }
        }
      };
      const yaml = jsonToYaml(data);

      expect(yaml).toContain('user:');
      expect(yaml).toContain('name: Rahul');
      expect(yaml).toContain('address:');
      expect(yaml).toContain('city: Jaipur');
    });

    it('should serialize null values', () => {
      const data = { name: 'Rahul', age: null };
      const yaml = jsonToYaml(data);

      expect(yaml).toContain('age: null');
    });

    it('should serialize boolean values', () => {
      const data = { active: true, deleted: false };
      const yaml = jsonToYaml(data);

      expect(yaml).toContain('active: true');
      expect(yaml).toContain('deleted: false');
    });

    it('should quote special strings', () => {
      const data = { value: 'true', another: 'null' };
      const yaml = jsonToYaml(data);

      expect(yaml).toContain('"true"');
      expect(yaml).toContain('"null"');
    });
  });

  describe('yamlToJson', () => {
    it('should parse basic YAML', () => {
      const yaml = 'name: Rahul\nage: 25\ncity: Jaipur';
      const result = yamlToJson(yaml);

      expect(result).toEqual({
        name: 'Rahul',
        age: 25,
        city: 'Jaipur'
      });
    });

    it('should parse arrays', () => {
      const yaml = 'skills:\n  - React\n  - Node.js\n  - TypeScript';
      const result = yamlToJson(yaml);

      expect((result as any).skills).toEqual(['React', 'Node.js', 'TypeScript']);
    });

    it('should parse nested objects', () => {
      const yaml = `user:
  name: Rahul
  address:
    city: Jaipur
    country: India`;
      const result = yamlToJson(yaml);

      expect((result as any).user.name).toBe('Rahul');
      expect((result as any).user.address.city).toBe('Jaipur');
    });

    it('should parse null values', () => {
      const yaml = 'name: Rahul\nage: null';
      const result = yamlToJson(yaml);

      expect((result as any).age).toBe(null);
    });

    it('should parse boolean values', () => {
      const yaml = 'active: true\ndeleted: false';
      const result = yamlToJson(yaml);

      expect((result as any).active).toBe(true);
      expect((result as any).deleted).toBe(false);
    });

    it('should parse empty YAML', () => {
      const result = yamlToJson('');
      expect(result).toBe(null);
    });

    it('should parse quoted strings', () => {
      const yaml = 'value: "true"\nanother: "null"';
      const result = yamlToJson(yaml);

      expect((result as any).value).toBe('true');
      expect((result as any).another).toBe('null');
    });

    it('should handle comments', () => {
      const yaml = '# This is a comment\nname: Rahul\n# Another comment\nage: 25';
      const result = yamlToJson(yaml);

      expect((result as any).name).toBe('Rahul');
      expect((result as any).age).toBe(25);
    });
  });

  describe('Round-trip YAML', () => {
    it('should convert JSON to YAML and back', () => {
      const original = {
        name: 'Rahul',
        age: 25,
        skills: ['React', 'Node.js']
      };

      const yaml = jsonToYaml(original);
      const parsed = yamlToJson(yaml);

      expect(parsed).toEqual(original);
    });

    it('should handle nested objects round-trip', () => {
      const original = {
        user: {
          name: 'Rahul',
          address: {
            city: 'Jaipur'
          }
        }
      };

      const yaml = jsonToYaml(original);
      const parsed = yamlToJson(yaml);

      expect(parsed).toEqual(original);
    });
  });
});
