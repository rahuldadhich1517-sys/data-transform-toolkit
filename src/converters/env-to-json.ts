/**
 * ENV to JSON Converter
 */

import { EnvParseError } from '../errors/index.js';
import { safeSetProperty, isDangerousKey } from '../internal/escaping.js';

export interface EnvToJsonOptions {
  /** If true, parse keys with delimiters (e.g. APP__PORT or APP.PORT) into nested objects */
  nested?: boolean;
  /** Delimiter for nested keys when nested=true. Defaults to '__' */
  nestedDelimiter?: string;
  /** If true, trim whitespace from unquoted values. Defaults to true */
  trimValues?: boolean;
}

/**
 * Convert .env file content into a JSON object
 */
export function envToJson(
  envContent: string,
  options: EnvToJsonOptions = {}
): Record<string, unknown> {
  if (typeof envContent !== 'string') {
    throw new EnvParseError('Input must be a string');
  }

  const lines = envContent.split(/\r?\n/);
  const result: Record<string, string> = {};
  const trim = options.trimValues !== false;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const rawLine = lines[lineIndex]!;
    const trimmed = rawLine.trim();

    // Skip empty lines and comment lines
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    // Strip optional leading 'export '
    let line = trimmed;
    if (line.startsWith('export ') || line.startsWith('export\t')) {
      line = line.substring(6).trim();
    }

    const equalIndex = line.indexOf('=');
    if (equalIndex === -1) {
      // Lines without '=' are invalid in env files
      throw new EnvParseError(`Invalid environment variable assignment at line ${lineIndex + 1}`, {
        line: lineIndex + 1
      });
    }

    const key = line.substring(0, equalIndex).trim();
    if (!key || !/^[a-zA-Z_][a-zA-Z0-9_.-]*$/.test(key)) {
      throw new EnvParseError(`Invalid environment variable name at line ${lineIndex + 1}`, {
        line: lineIndex + 1
      });
    }

    let valStr = line.substring(equalIndex + 1);
    if (trim) {
      valStr = valStr.trim();
    }

    let finalValue = '';

    if (valStr.startsWith('"')) {
      // Double quoted: support escapes, multiline values, and inline comments
      let escaped = false;
      let closed = false;
      let pos = 1;

      while (!closed) {
        while (pos < valStr.length) {
          const c = valStr[pos]!;
          pos++;
          if (escaped) {
            switch (c) {
              case 'n': finalValue += '\n'; break;
              case 'r': finalValue += '\r'; break;
              case 't': finalValue += '\t'; break;
              case '"': finalValue += '"'; break;
              case '\\': finalValue += '\\'; break;
              default: finalValue += c;
            }
            escaped = false;
          } else if (c === '\\') {
            escaped = true;
          } else if (c === '"') {
            closed = true;
            break;
          } else {
            finalValue += c;
          }
        }

        if (!closed) {
          if (lineIndex + 1 < lines.length) {
            lineIndex++;
            valStr = lines[lineIndex]!;
            finalValue += '\n';
            pos = 0;
          } else {
            break;
          }
        }
      }

      if (!closed) {
        throw new EnvParseError(`Unclosed double quote in environment variable at line ${lineIndex + 1}`, {
          line: lineIndex + 1
        });
      }
    } else if (valStr.startsWith("'")) {
      // Single quoted: raw characters until closing quote
      const closeIndex = valStr.indexOf("'", 1);
      if (closeIndex === -1) {
        throw new EnvParseError(`Unclosed single quote in environment variable at line ${lineIndex + 1}`, {
          line: lineIndex + 1
        });
      }
      finalValue = valStr.substring(1, closeIndex);
    } else {
      // Unquoted: strip trailing comments e.g. FOO=bar # comment
      const commentIdx = valStr.search(/\s+#/);
      if (commentIdx !== -1) {
        finalValue = valStr.substring(0, commentIdx);
      } else {
        finalValue = valStr;
      }
      if (trim) {
        finalValue = finalValue.trim();
      }
    }

    result[key] = finalValue;
  }

  if (options.nested) {
    const delim = options.nestedDelimiter ?? '__';
    return expandNestedKeys(result, delim);
  }

  return result;
}

function expandNestedKeys(flat: Record<string, string>, delimiter: string): Record<string, unknown> {
  const root: Record<string, unknown> = {};

  for (const [flatKey, value] of Object.entries(flat)) {
    const parts = flatKey.split(delimiter);
    if (parts.some(p => isDangerousKey(p))) {
      continue;
    }
    let cur = root;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]!;
      if (!cur[part] || typeof cur[part] !== 'object' || Array.isArray(cur[part])) {
        cur[part] = {};
      }
      cur = cur[part] as Record<string, unknown>;
    }

    const lastPart = parts[parts.length - 1]!;
    safeSetProperty(cur, lastPart, value);
  }

  return root;
}
