import { describe, it, expect } from 'vitest';
import {
  jsObjectToJson,
  plistToJson,
  protobufDecode,
  sqlToJson
} from '../index.js';
import { JsObjectParseError, ProtobufDecodeError } from '../errors/index.js';

describe('Specialized Utilities', () => {
  describe('jsObjectToJson', () => {
    it('parses valid JS object literal with unquoted keys and single quotes', () => {
      const jsObj = `
      {
        name: 'Rahul',
        age: 23,
        active: true,
        tags: ['js', 'ts'],
        nested: { count: 42 }
      }`;
      const jsonStr = jsObjectToJson(jsObj);
      const parsed = JSON.parse(jsonStr);
      expect(parsed).toEqual({
        name: 'Rahul',
        age: 23,
        active: true,
        tags: ['js', 'ts'],
        nested: { count: 42 }
      });
    });

    it('strictly rejects executable functions, variables, and calls without eval', () => {
      expect(() => jsObjectToJson('{ fn: function() { return 1; } }')).toThrow(JsObjectParseError);
      expect(() => jsObjectToJson('{ fn: () => 1 }')).toThrow(JsObjectParseError);
      expect(() => jsObjectToJson('{ val: myVar }')).toThrow(JsObjectParseError);
      expect(() => jsObjectToJson('{ val: doSomething() }')).toThrow(JsObjectParseError);
      expect(() => jsObjectToJson('{ ...other }')).toThrow(JsObjectParseError);
    });
  });

  describe('plistToJson', () => {
    it('parses Apple XML plist into JSON structure', () => {
      const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Name</key>
  <string>John Doe</string>
  <key>Age</key>
  <integer>30</integer>
  <key>Score</key>
  <real>98.6</real>
  <key>Enabled</key>
  <true/>
  <key>Items</key>
  <array>
    <string>one</string>
    <string>two</string>
  </array>
</dict>
</plist>`;
      const result = plistToJson(plist);
      expect(result).toEqual({
        Name: 'John Doe',
        Age: 30,
        Score: 98.6,
        Enabled: true,
        Items: ['one', 'two']
      });
    });
  });

  describe('protobufDecode', () => {
    it('decodes varint, length-delimited string, and fixed numbers from hex', () => {
      // Field 1, wire type 0 (varint): value 150 -> tag: (1 << 3) | 0 = 0x08, val: 0x96, 0x01
      // Field 2, wire type 2 (length-delimited): "testing" (7 bytes) -> tag: (2 << 3) | 2 = 0x12, len: 0x07, "testing"
      // Field 3, wire type 5 (fixed32): 100 -> tag: (3 << 3) | 5 = 0x1d, 4 bytes: 0x64, 0x00, 0x00, 0x00
      const hex = '089601120774657374696e671d64000000';
      const fields = protobufDecode(hex);

      expect(fields.length).toBe(3);

      expect(fields[0]).toEqual({
        fieldNumber: 1,
        wireType: 0,
        wireTypeName: 'varint',
        value: 150
      });

      expect(fields[1]).toEqual({
        fieldNumber: 2,
        wireType: 2,
        wireTypeName: 'length-delimited',
        value: 'testing'
      });

      expect(fields[2]).toEqual({
        fieldNumber: 3,
        wireType: 5,
        wireTypeName: 'fixed32',
        value: 100
      });
    });

    it('detects truncated data and throws error', () => {
      // Truncated varint
      const truncated = '0896';
      expect(() => protobufDecode(truncated)).toThrow(ProtobufDecodeError);
    });
  });

  describe('sqlToJson', () => {
    it('parses INSERT statement into array of JSON records', () => {
      const sql = "INSERT INTO users (id, name, age) VALUES (1, 'Rahul', 23), (2, 'Amit', 25);";
      const records = sqlToJson(sql);
      expect(records).toEqual([
        { id: 1, name: 'Rahul', age: 23 },
        { id: 2, name: 'Amit', age: 25 }
      ]);
    });
  });
});
