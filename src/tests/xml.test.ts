import { describe, it, expect } from 'vitest';
import { jsonToXml, xmlToJson } from '../index';

describe('XML Converters', () => {
  describe('jsonToXml', () => {
    it('should serialize basic objects', () => {
      const data = {
        user: {
          name: 'Rahul',
          age: 25
        }
      };
      const xml = jsonToXml(data);

      expect(xml).toContain('<user>');
      expect(xml).toContain('<name>Rahul</name>');
      expect(xml).toContain('<age>25</age>');
      expect(xml).toContain('</user>');
    });

    it('should serialize with XML declaration', () => {
      const data = { user: { name: 'Rahul' } };
      const xml = jsonToXml(data);

      expect(xml).toContain('<?xml version="1.0"');
    });

    it('should escape special characters', () => {
      const data = {
        user: {
          description: 'Hello & Goodbye <world>'
        }
      };
      const xml = jsonToXml(data);

      expect(xml).toContain('&amp;');
      expect(xml).toContain('&lt;');
      expect(xml).toContain('&gt;');
    });

    it('should serialize null as self-closing tags', () => {
      const data = {
        user: {
          name: 'Rahul',
          age: null
        }
      };
      const xml = jsonToXml(data);

      expect(xml).toContain('<age');
    });

    it('should serialize arrays as repeated elements', () => {
      const data = {
        users: [
          { user: { name: 'Rahul' } },
          { user: { name: 'Amit' } }
        ]
      };
      const xml = jsonToXml(data);

      expect(xml).toContain('<user>');
      expect(xml).toContain('<name>Rahul</name>');
      expect(xml).toContain('<name>Amit</name>');
    });

    it('should handle nested objects', () => {
      const data = {
        user: {
          name: 'Rahul',
          address: {
            city: 'Jaipur',
            country: 'India'
          }
        }
      };
      const xml = jsonToXml(data);

      expect(xml).toContain('<address>');
      expect(xml).toContain('<city>Jaipur</city>');
      expect(xml).toContain('</address>');
    });
  });

  describe('xmlToJson', () => {
    it('should parse basic XML', () => {
      const xml = `<user>
        <name>Rahul</name>
        <age>25</age>
      </user>`;
      const result = xmlToJson(xml);

      expect((result as any).user.name).toBe('Rahul');
      expect((result as any).user.age).toBe(25);
    });

    it('should parse nested elements', () => {
      const xml = `<user>
        <name>Rahul</name>
        <address>
          <city>Jaipur</city>
          <country>India</country>
        </address>
      </user>`;
      const result = xmlToJson(xml);

      expect((result as any).user.address.city).toBe('Jaipur');
    });

    it('should handle repeated elements as arrays', () => {
      const xml = `<users>
        <user>
          <name>Rahul</name>
        </user>
        <user>
          <name>Amit</name>
        </user>
      </users>`;
      const result = xmlToJson(xml);

      const users = (result as any).users.user;
      expect(Array.isArray(users)).toBe(true);
      expect(users[0].name).toBe('Rahul');
      expect(users[1].name).toBe('Amit');
    });

    it('should handle self-closing tags', () => {
      const xml = '<root><item /><name>Test</name></root>';
      const result = xmlToJson(xml);

      expect(result).toBeDefined();
    });

    it('should unescape XML entities', () => {
      const xml = '<user><description>Hello &amp; Goodbye &lt;world&gt;</description></user>';
      const result = xmlToJson(xml);

      expect((result as any).user.description).toBe('Hello & Goodbye <world>');
    });

    it('should handle empty elements', () => {
      const xml = '<user><name>Rahul</name><age></age></user>';
      const result = xmlToJson(xml);

      expect((result as any).user.name).toBe('Rahul');
      expect((result as any).user.age).toBe('');
    });
  });

  describe('Round-trip XML', () => {
    it('should convert JSON to XML and parse back', () => {
      const original = {
        user: {
          name: 'Rahul',
          age: 25,
          city: 'Jaipur'
        }
      };

      const xml = jsonToXml(original);
      const parsed = xmlToJson(xml);

      expect((parsed as any).user.name).toBe('Rahul');
      expect((parsed as any).user.city).toBe('Jaipur');
    });

    it('should handle nested objects round-trip', () => {
      const original = {
        company: {
          name: 'TechCorp',
          location: {
            city: 'Bangalore',
            country: 'India'
          }
        }
      };

      const xml = jsonToXml(original);
      const parsed = xmlToJson(xml);

      expect((parsed as any).company.name).toBe('TechCorp');
      expect((parsed as any).company.location.city).toBe('Bangalore');
    });
  });

  describe('Security', () => {
    it('should not allow entity expansion attacks', () => {
      const maliciousXml = `<?xml version="1.0"?>
<!DOCTYPE lolz [
  <!ENTITY lol "lol">
  <!ENTITY lol2 "&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;">
]>
<lolz>&lol2;</lolz>`;

      // Should not throw or hang - parse safely
      const result = xmlToJson(maliciousXml);
      expect(result).toBeDefined();
    });

    it('should handle deeply nested XML safely', () => {
      let xml = '<root>';
      for (let i = 0; i < 50; i++) {
        xml += '<level><content>test</content>';
      }
      for (let i = 0; i < 50; i++) {
        xml += '</level>';
      }
      xml += '</root>';

      const result = xmlToJson(xml);
      expect(result).toBeDefined();
    });
  });
});
