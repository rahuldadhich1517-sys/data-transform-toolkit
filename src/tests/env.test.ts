import { describe, it, expect } from 'vitest';
import { envToJson, jsonToEnv } from '../index.js';
import { EnvParseError, InvalidInputError } from '../errors/index.js';

describe('envToJson and jsonToEnv', () => {
  it('parses basic KEY=value pairs', () => {
    const env = `
PORT=3000
NODE_ENV=production
APP_NAME=Toolkit
DEBUG=true
`;
    const result = envToJson(env);
    expect(result).toEqual({
      PORT: '3000',
      NODE_ENV: 'production',
      APP_NAME: 'Toolkit',
      DEBUG: 'true'
    });
  });

  it('supports quotes, escaped characters, and inline comments', () => {
    const env = `
DOUBLE="Hello \\"World\\"\nNew Line"
SINGLE='Raw $value #notcomment'
WITH_COMMENT=123 # inline comment
export FOO=bar
`;
    const result = envToJson(env);
    expect(result.DOUBLE).toBe('Hello "World"\nNew Line');
    expect(result.SINGLE).toBe('Raw $value #notcomment');
    expect(result.WITH_COMMENT).toBe('123');
    expect(result.FOO).toBe('bar');
  });

  it('handles empty values and whitespace', () => {
    const env = `
EMPTY=
SPACED =  hello world  
`;
    const result = envToJson(env);
    expect(result.EMPTY).toBe('');
    expect(result.SPACED).toBe('hello world');
  });

  it('handles equals signs inside values', () => {
    const env = 'URL=https://example.com/query?a=1&b=2';
    const result = envToJson(env);
    expect(result.URL).toBe('https://example.com/query?a=1&b=2');
  });

  it('supports nested option', () => {
    const env = `
DATABASE__HOST=localhost
DATABASE__PORT=5432
`;
    const result = envToJson(env, { nested: true, nestedDelimiter: '__' });
    expect(result).toEqual({
      DATABASE: {
        HOST: 'localhost',
        PORT: '5432'
      }
    });
  });

  it('throws on invalid env line without equal sign', () => {
    expect(() => envToJson('INVALID_LINE')).toThrow(EnvParseError);
  });

  it('converts json to env format', () => {
    const json = {
      PORT: 3000,
      NODE_ENV: 'production',
      APP_NAME: 'My App',
      DEBUG: true
    };
    const env = jsonToEnv(json);
    expect(env).toBe('APP_NAME="My App"\nDEBUG=true\nNODE_ENV=production\nPORT=3000');
  });

  it('throws on nested object in jsonToEnv unless flatten=true', () => {
    const nested = { db: { host: 'localhost' } };
    expect(() => jsonToEnv(nested)).toThrow(InvalidInputError);

    const flattened = jsonToEnv(nested, { flatten: true });
    expect(flattened).toBe('db__host=localhost');
  });

  it('round-trips flat environment variables', () => {
    const original = {
      APP_KEY: 'secret123',
      PORT: '8080',
      TITLE: 'Hello World'
    };
    const envStr = jsonToEnv(original);
    const parsed = envToJson(envStr);
    expect(parsed).toEqual(original);
  });
});
