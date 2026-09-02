/**
 * YAML Parser - Converts YAML format to JSON
 */

import type { YamlParseOptions, YamlValue, YamlScalar } from '../types/yaml.js';
import { YamlParseError } from '../errors/index.js';

interface ParserContext {
  lines: string[];
  currentLine: number;
  maxDepth: number;
  depth: number;
  strict: boolean;
}

export class YamlParser {
  private readonly indentSize: number;
  private readonly maxDepth: number;
  private readonly maxStringLength: number;
  private readonly strict: boolean;

  constructor(options: YamlParseOptions = {}) {
    this.indentSize = options.indentSize ?? 2;
    this.maxDepth = options.maxDepth ?? 100;
    this.maxStringLength = options.maxStringLength ?? 1048576;
    this.strict = options.strict ?? false;
  }

  public parse(yaml: string): YamlValue {
    if (typeof yaml !== 'string') {
      throw new YamlParseError('Input must be a string', { context: { type: typeof yaml } });
    }

    const trimmed = yaml.trim();
    if (trimmed === '' || trimmed === 'null') {
      return null;
    }

    const lines = trimmed.split(/\r?\n/);
    const context: ParserContext = {
      lines,
      currentLine: 0,
      maxDepth: this.maxDepth,
      depth: 0,
      strict: this.strict
    };

    const result = this.parseValue(context, -1);
    return result;
  }

  private parseValue(context: ParserContext, parentIndent: number): YamlValue {
    while (context.currentLine < context.lines.length) {
      const line = context.lines[context.currentLine]!;

      // Skip empty lines and comments
      if (line.trim() === '' || line.trim().startsWith('#')) {
        context.currentLine++;
        continue;
      }

      const indent = this.getIndentation(line);

      if (indent < parentIndent) {
        // This line belongs to a parent scope
        return undefined as unknown as YamlValue;
      }

      if (indent > parentIndent + this.indentSize && parentIndent >= 0) {
        // Unexpected indentation
        if (this.strict) {
          throw new YamlParseError('Unexpected indentation', {
            line: context.currentLine + 1,
            column: indent + 1
          });
        }
        context.currentLine++;
        continue;
      }

      const content = line.trim();

      // Check if it's a list item
      if (content.startsWith('- ')) {
        return this.parseArray(context, indent);
      }

      // Check if it's a key-value pair
      const colonIndex = content.indexOf(':');
      if (colonIndex > 0 && !this.isInQuotes(content, colonIndex)) {
        return this.parseObject(context, indent);
      }

      // Scalar value
      context.currentLine++;
      return this.parseScalar(content);
    }

    return undefined as unknown as YamlValue;
  }

  private parseObject(context: ParserContext, baseIndent: number): YamlValue {
    if (context.depth >= context.maxDepth) {
      throw new YamlParseError('Maximum nesting depth exceeded', {
        line: context.currentLine + 1,
        context: { maxDepth: context.maxDepth }
      });
    }

    const obj: Record<string, YamlValue> = {};
    context.depth++;

    while (context.currentLine < context.lines.length) {
      const line = context.lines[context.currentLine];

      if (line.trim() === '' || line.trim().startsWith('#')) {
        context.currentLine++;
        continue;
      }

      const indent = this.getIndentation(line);

      if (indent < baseIndent) {
        break;
      }

      if (indent > baseIndent) {
        // Skip over-indented lines in object context
        context.currentLine++;
        continue;
      }

      const content = line.trim();

      // Parse key-value pair
      const colonIndex = content.indexOf(':');
      if (colonIndex <= 0 || this.isInQuotes(content, colonIndex)) {
        break;
      }

      const key = this.unquoteString(content.substring(0, colonIndex).trim());
      const valueStr = content.substring(colonIndex + 1).trim();

      context.currentLine++;

      if (valueStr === '') {
        // Value is on the next line with indentation
        if (
          context.currentLine < context.lines.length &&
          this.getIndentation(context.lines[context.currentLine]) > baseIndent
        ) {
          const value = this.parseValue(context, baseIndent + this.indentSize);
          obj[key] = value;
        } else {
          obj[key] = null;
        }
      } else if (valueStr.startsWith('- ')) {
        // Inline array start - parse as array
        context.currentLine--;
        const value = this.parseValue(context, baseIndent);
        context.currentLine++;
        obj[key] = value;
      } else {
        // Inline scalar value
        obj[key] = this.parseScalar(valueStr);
      }
    }

    context.depth--;
    return obj;
  }

  private parseArray(context: ParserContext, baseIndent: number): YamlValue {
    if (context.depth >= context.maxDepth) {
      throw new YamlParseError('Maximum nesting depth exceeded', {
        line: context.currentLine + 1,
        context: { maxDepth: context.maxDepth }
      });
    }

    const arr: YamlValue[] = [];
    context.depth++;

    while (context.currentLine < context.lines.length) {
      const line = context.lines[context.currentLine];

      if (line.trim() === '' || line.trim().startsWith('#')) {
        context.currentLine++;
        continue;
      }

      const indent = this.getIndentation(line);

      if (indent < baseIndent) {
        break;
      }

      if (indent > baseIndent + this.indentSize) {
        context.currentLine++;
        continue;
      }

      const content = line.trim();

      if (!content.startsWith('- ')) {
        break;
      }

      const valueStr = content.substring(2).trim();
      context.currentLine++;

      if (valueStr === '') {
        // Value is on the next line
        if (
          context.currentLine < context.lines.length &&
          this.getIndentation(context.lines[context.currentLine]) > baseIndent
        ) {
          const value = this.parseValue(context, baseIndent + this.indentSize);
          arr.push(value);
        } else {
          arr.push(null);
        }
      } else if (valueStr.startsWith('{') || valueStr.startsWith('[')) {
        // Inline JSON
        try {
          arr.push(JSON.parse(valueStr));
        } catch {
          arr.push(this.parseScalar(valueStr));
        }
      } else {
        arr.push(this.parseScalar(valueStr));
      }
    }

    context.depth--;
    return arr;
  }

  private parseScalar(value: string): YamlScalar {
    if (value.length > this.maxStringLength) {
      throw new YamlParseError('String exceeds maximum length', {
        context: { maxLength: this.maxStringLength }
      });
    }

    const trimmed = value.trim();

    if (trimmed === 'null') {
      return null;
    }

    if (trimmed === 'true') {
      return true;
    }

    if (trimmed === 'false') {
      return false;
    }

    // Check if it's a number
    if (/^-?\d+(\.\d+)?([eE][-+]?\d+)?$/.test(trimmed)) {
      const num = parseFloat(trimmed);
      if (!isNaN(num)) {
        return num;
      }
    }

    // Unquote strings
    return this.unquoteString(trimmed);
  }

  private unquoteString(str: string): string {
    if (str.startsWith('"') && str.endsWith('"') && str.length >= 2) {
      return this.unescapeString(str.substring(1, str.length - 1));
    }

    if (str.startsWith("'") && str.endsWith("'") && str.length >= 2) {
      // Single quotes don't have escape sequences in YAML
      return str.substring(1, str.length - 1).replace(/''/g, "'");
    }

    return str;
  }

  private unescapeString(str: string): string {
    return str
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t');
  }

  private getIndentation(line: string): number {
    let indent = 0;
    for (const char of line) {
      if (char === ' ') {
        indent++;
      } else if (char === '\t') {
        indent += this.indentSize;
      } else {
        break;
      }
    }
    return indent;
  }

  private isInQuotes(str: string, position: number): boolean {
    let inSingle = false;
    let inDouble = false;

    for (let i = 0; i < position; i++) {
      const char = str[i];
      const prev = i > 0 ? str[i - 1] : '';

      if (char === '"' && prev !== '\\') {
        inDouble = !inDouble;
      } else if (char === "'" && prev !== '\\') {
        inSingle = !inSingle;
      }
    }

    return inSingle || inDouble;
  }
}

export function parseYaml(yaml: string, options?: YamlParseOptions): YamlValue {
  const parser = new YamlParser(options);
  return parser.parse(yaml);
}
