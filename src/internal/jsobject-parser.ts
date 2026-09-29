/**
 * Safe JavaScript Object Literal Parser
 * NEVER uses eval() or new Function(). Parses object literals strictly as data syntax.
 */

import { JsObjectParseError } from '../errors/index.js';

export function parseJsObjectLiteral(input: string): unknown {
  const src = input.trim();
  if (!src) {
    throw new JsObjectParseError('Input is empty');
  }

  let i = 0;
  let line = 1;
  let col = 1;

  function updatePos(c: string) {
    if (c === '\n') {
      line++;
      col = 1;
    } else {
      col++;
    }
  }

  function skipWhitespaceAndComments() {
    while (i < src.length) {
      const c = src[i];
      if (c === '\n') {
        line++;
        col = 1;
        i++;
      } else if (/\s/.test(c)) {
        col++;
        i++;
      } else if (src.startsWith('//', i)) {
        // Line comment
        while (i < src.length && src[i] !== '\n') {
          i++;
        }
      } else if (src.startsWith('/*', i)) {
        // Block comment
        const startLine = line;
        const startCol = col;
        const end = src.indexOf('*/', i + 2);
        if (end === -1) {
          throw new JsObjectParseError('Unterminated block comment', { line: startLine, column: startCol });
        }
        for (let j = i; j < end + 2; j++) {
          updatePos(src[j]!);
        }
        i = end + 2;
      } else {
        break;
      }
    }
  }

  function parseString(quote: '"' | "'"): string {
    const startLine = line;
    const startCol = col;
    i++; // Skip opening quote
    col++;

    let result = '';
    while (i < src.length) {
      const c = src[i]!;
      if (c === quote) {
        i++;
        col++;
        return result;
      } else if (c === '\\') {
        i++;
        col++;
        if (i >= src.length) {
          throw new JsObjectParseError('Unfinished escape sequence in string', { line: startLine, column: startCol });
        }
        const esc = src[i]!;
        i++;
        col++;
        switch (esc) {
          case 'n': result += '\n'; break;
          case 'r': result += '\r'; break;
          case 't': result += '\t'; break;
          case 'b': result += '\b'; break;
          case 'f': result += '\f'; break;
          case '"': result += '"'; break;
          case "'": result += "'"; break;
          case '\\': result += '\\'; break;
          case 'u': {
            const hex = src.substring(i, i + 4);
            if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
              throw new JsObjectParseError('Invalid unicode escape sequence', { line, column: col });
            }
            result += String.fromCharCode(parseInt(hex, 16));
            i += 4;
            col += 4;
            break;
          }
          default:
            result += esc;
        }
      } else if (c === '\n') {
        throw new JsObjectParseError('Unterminated string literal on line break', { line: startLine, column: startCol });
      } else {
        result += c;
        updatePos(c);
        i++;
      }
    }

    throw new JsObjectParseError(`Unterminated string literal, expected closing ${quote}`, { line: startLine, column: startCol });
  }

  function parseNumber(): number {
    const startLine = line;
    const startCol = col;
    const start = i;

    // Check hex / octal / binary
    if (src.startsWith('0x', i) || src.startsWith('0X', i)) {
      i += 2;
      col += 2;
      while (i < src.length && /[0-9a-fA-F]/.test(src[i]!)) {
        i++;
        col++;
      }
      return parseInt(src.substring(start, i), 16);
    }
    if (src.startsWith('0o', i) || src.startsWith('0O', i)) {
      i += 2;
      col += 2;
      while (i < src.length && /[0-7]/.test(src[i]!)) {
        i++;
        col++;
      }
      return parseInt(src.substring(start + 2, i), 8);
    }

    // Regular number
    const numMatch = src.substring(i).match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][-+]?\d+)?/);
    if (!numMatch) {
      throw new JsObjectParseError('Invalid number format', { line: startLine, column: startCol });
    }
    const numStr = numMatch[0];
    i += numStr.length;
    col += numStr.length;
    return Number(numStr);
  }

  function parseIdentifier(): string {
    const start = i;
    const match = src.substring(i).match(/^[a-zA-Z_$][a-zA-Z0-9_$]*/);
    if (!match) {
      throw new JsObjectParseError(`Expected identifier, found "${src[i]}"`, { line, column: col });
    }
    const id = match[0];
    i += id.length;
    col += id.length;
    return id;
  }

  function parseValue(): unknown {
    skipWhitespaceAndComments();
    if (i >= src.length) {
      throw new JsObjectParseError('Unexpected end of input');
    }

    const c = src[i]!;

    if (c === '{') {
      return parseObject();
    }
    if (c === '[') {
      return parseArray();
    }
    if (c === '"' || c === "'") {
      return parseString(c);
    }
    if (c === '-' || /\d/.test(c)) {
      return parseNumber();
    }
    if (src.startsWith('`', i)) {
      throw new JsObjectParseError('Template literals are not supported for security', { line, column: col });
    }

    // Keywords or reject expressions
    const id = parseIdentifier();
    if (id === 'true') return true;
    if (id === 'false') return false;
    if (id === 'null') return null;

    if (id === 'undefined') {
      return null;
    }

    if (id === 'function' || id === 'async' || id === 'class' || id === 'new') {
      throw new JsObjectParseError(`Functions and executable code are not allowed: found keyword "${id}"`, {
        line,
        column: col
      });
    }

    // Check if next token is function call `(` or arrow `=>`
    skipWhitespaceAndComments();
    if (src[i] === '(' || src.startsWith('=>', i)) {
      throw new JsObjectParseError(`Function calls and expressions are strictly prohibited: "${id}"`, {
        line,
        column: col
      });
    }

    throw new JsObjectParseError(`Unsupported JavaScript expression or identifier: "${id}". Only literal data is allowed.`, {
      line,
      column: col
    });
  }

  function parseObject(): Record<string, unknown> {
    const obj: Record<string, unknown> = {};
    const startLine = line;
    const startCol = col;
    i++; // skip '{'
    col++;

    while (true) {
      skipWhitespaceAndComments();
      if (i >= src.length) {
        throw new JsObjectParseError('Unclosed object literal, expected "}"', { line: startLine, column: startCol });
      }

      if (src[i] === '}') {
        i++; // skip '}'
        col++;
        return obj;
      }

      // Check spread operator
      if (src.startsWith('...', i)) {
        throw new JsObjectParseError('Spread operator is not allowed in object literals', { line, column: col });
      }

      // Check computed property
      if (src[i] === '[') {
        throw new JsObjectParseError('Computed property names are not allowed for security', { line, column: col });
      }

      // Key: unquoted identifier or quoted string
      let key = '';
      if (src[i] === '"' || src[i] === "'") {
        key = parseString(src[i] as '"' | "'");
      } else {
        key = parseIdentifier();
      }

      skipWhitespaceAndComments();
      if (src[i] !== ':') {
        throw new JsObjectParseError(`Expected ":" after property key "${key}", found "${src[i]}"`, { line, column: col });
      }
      i++; // skip ':'
      col++;

      const val = parseValue();
      obj[key] = val;

      skipWhitespaceAndComments();
      if (src[i] === ',') {
        i++; // skip ','
        col++;
        skipWhitespaceAndComments();
        // Allow trailing comma: e.g. { a: 1, }
        if (src[i] === '}') {
          i++; // skip '}'
          col++;
          return obj;
        }
      } else if (src[i] !== '}') {
        throw new JsObjectParseError(`Expected "," or "}" in object literal, found "${src[i]}"`, { line, column: col });
      }
    }
  }

  function parseArray(): unknown[] {
    const arr: unknown[] = [];
    const startLine = line;
    const startCol = col;
    i++; // skip '['
    col++;

    while (true) {
      skipWhitespaceAndComments();
      if (i >= src.length) {
        throw new JsObjectParseError('Unclosed array literal, expected "]"', { line: startLine, column: startCol });
      }

      if (src[i] === ']') {
        i++; // skip ']'
        col++;
        return arr;
      }

      if (src.startsWith('...', i)) {
        throw new JsObjectParseError('Spread operator is not allowed in array literals', { line, column: col });
      }

      const val = parseValue();
      arr.push(val);

      skipWhitespaceAndComments();
      if (src[i] === ',') {
        i++; // skip ','
        col++;
        skipWhitespaceAndComments();
        // Allow trailing comma: e.g. [1, 2, ]
        if (src[i] === ']') {
          i++; // skip ']'
          col++;
          return arr;
        }
      } else if (src[i] !== ']') {
        throw new JsObjectParseError(`Expected "," or "]" in array literal, found "${src[i]}"`, { line, column: col });
      }
    }
  }

  const result = parseValue();
  skipWhitespaceAndComments();
  if (i < src.length) {
    throw new JsObjectParseError(`Unexpected trailing tokens after object literal: "${src.substring(i, i + 20)}"`, {
      line,
      column: col
    });
  }

  return result;
}
