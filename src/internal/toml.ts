/**
 * Zero-dependency TOML 1.0 parser and serializer
 */

import { TomlParseError } from '../errors/index.js';
import { safeSetProperty, isDangerousKey } from './escaping.js';

export function parseToml(input: string): Record<string, unknown> {
  const src = input.trim();
  if (!src) return {};

  const lines = input.split(/\r?\n/);
  const root: Record<string, unknown> = {};
  let currentTarget: Record<string, unknown> = root;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    let line = lines[lineIndex]!.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    // Strip trailing comment if not in quotes
    line = stripComment(line);
    if (!line) continue;

    // Array of tables: [[table.name]]
    if (line.startsWith('[[') && line.endsWith(']]')) {
      const pathStr = line.substring(2, line.length - 2).trim();
      const keys = parseDottedKeys(pathStr, lineIndex + 1);
      if (keys.some(k => isDangerousKey(k))) {
        continue;
      }

      let cur = root;
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i]!;
        if (!cur[k] || typeof cur[k] !== 'object') {
          cur[k] = {};
        }
        cur = cur[k] as Record<string, unknown>;
      }

      const lastKey = keys[keys.length - 1]!;
      if (!Array.isArray(cur[lastKey])) {
        cur[lastKey] = [];
      }
      const arr = cur[lastKey] as Record<string, unknown>[];
      const newObj: Record<string, unknown> = {};
      arr.push(newObj);
      currentTarget = newObj;
      continue;
    }

    // Standard table: [table.name]
    if (line.startsWith('[') && line.endsWith(']')) {
      const pathStr = line.substring(1, line.length - 1).trim();
      const keys = parseDottedKeys(pathStr, lineIndex + 1);
      if (keys.some(k => isDangerousKey(k))) {
        continue;
      }

      let cur = root;
      for (const k of keys) {
        if (!cur[k] || typeof cur[k] !== 'object' || Array.isArray(cur[k])) {
          cur[k] = {};
        }
        cur = cur[k] as Record<string, unknown>;
      }
      currentTarget = cur;
      continue;
    }

    // Key-value pair: key = val
    const eqIdx = findEqualsIndex(line);
    if (eqIdx === -1) {
      throw new TomlParseError(`Expected "=" at line ${lineIndex + 1}: ${line}`, { line: lineIndex + 1 });
    }

    const keyStr = line.substring(0, eqIdx).trim();
    let valStr = line.substring(eqIdx + 1).trim();

    // Check for multiline string start: """ or '''
    if ((valStr.startsWith('"""') && (valStr.length === 3 || !valStr.endsWith('"""'))) ||
        (valStr.startsWith("'''") && (valStr.length === 3 || !valStr.endsWith("'''")))) {
      const quote = valStr.substring(0, 3);
      let multilineVal = valStr.substring(3);
      let foundEnd = false;
      while (++lineIndex < lines.length) {
        const nextLine = lines[lineIndex]!;
        const endIdx = nextLine.indexOf(quote);
        if (endIdx !== -1) {
          multilineVal += '\n' + nextLine.substring(0, endIdx);
          foundEnd = true;
          break;
        } else {
          multilineVal += '\n' + nextLine;
        }
      }
      if (!foundEnd) {
        throw new TomlParseError(`Unterminated multiline string at line ${lineIndex + 1}`, { line: lineIndex + 1 });
      }
      valStr = quote === '"""' ? parseBasicStringContent(multilineVal) : multilineVal;
    }

    const keys = parseDottedKeys(keyStr, lineIndex + 1);
    if (keys.some(k => isDangerousKey(k))) {
      continue;
    }
    const parsedVal = parseTomlValue(valStr, lineIndex + 1);

    let target = currentTarget;
    for (let k = 0; k < keys.length - 1; k++) {
      const key = keys[k]!;
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {};
      }
      target = target[key] as Record<string, unknown>;
    }
    const finalKey = keys[keys.length - 1]!;
    safeSetProperty(target, finalKey, parsedVal);
  }

  return root;
}

function findEqualsIndex(line: string): number {
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (c === '"' && !inSingle) inDouble = !inDouble;
    else if (c === "'" && !inDouble) inSingle = !inSingle;
    else if (c === '=' && !inSingle && !inDouble) return i;
  }
  return -1;
}

function stripComment(line: string): string {
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (c === '"' && !inSingle) inDouble = !inDouble;
    else if (c === "'" && !inDouble) inSingle = !inSingle;
    else if (c === '#' && !inSingle && !inDouble) {
      return line.substring(0, i).trim();
    }
  }
  return line;
}

function parseDottedKeys(keyStr: string, line: number): string[] {
  const keys: string[] = [];
  let cur = '';
  let inDouble = false;
  let inSingle = false;

  for (let i = 0; i < keyStr.length; i++) {
    const c = keyStr[i]!;
    if (c === '"' && !inSingle) {
      inDouble = !inDouble;
    } else if (c === "'" && !inDouble) {
      inSingle = !inSingle;
    } else if (c === '.' && !inDouble && !inSingle) {
      const clean = cur.trim();
      if (!clean) throw new TomlParseError(`Empty key segment at line ${line}`, { line });
      keys.push(unquoteKey(clean));
      cur = '';
    } else {
      cur += c;
    }
  }
  const clean = cur.trim();
  if (!clean) throw new TomlParseError(`Empty key segment at line ${line}`, { line });
  keys.push(unquoteKey(clean));
  return keys;
}

function unquoteKey(key: string): string {
  if (key.startsWith('"') && key.endsWith('"') && key.length >= 2) {
    return parseBasicStringContent(key.substring(1, key.length - 1));
  }
  if (key.startsWith("'") && key.endsWith("'") && key.length >= 2) {
    return key.substring(1, key.length - 1);
  }
  return key;
}

function parseTomlValue(valStr: string, line: number): unknown {
  const trimmed = valStr.trim();
  if (!trimmed) {
    throw new TomlParseError(`Empty value at line ${line}`, { line });
  }

  // Basic string: "..."
  if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) {
    return parseBasicStringContent(trimmed.substring(1, trimmed.length - 1));
  }

  // Literal string: '...'
  if (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2) {
    return trimmed.substring(1, trimmed.length - 1);
  }

  // Boolean
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;

  // Numbers (Integers, Floats, Hex, Octal, Binary)
  if (/^[-+]?0x[0-9a-fA-F_]+$/.test(trimmed)) {
    return parseInt(trimmed.replace(/_/g, ''), 16);
  }
  if (/^[-+]?0o[0-7_]+$/.test(trimmed)) {
    return parseInt(trimmed.substring(2).replace(/_/g, ''), 8);
  }
  if (/^[-+]?0b[01_]+$/.test(trimmed)) {
    return parseInt(trimmed.substring(2).replace(/_/g, ''), 2);
  }
  if (/^[-+]?\d[\d_]*(?:\.[\d_]+)?(?:[eE][-+]?[\d_]+)?$/.test(trimmed)) {
    const cleanNum = trimmed.replace(/_/g, '');
    return Number(cleanNum);
  }
  if (trimmed === 'inf' || trimmed === '+inf') return Infinity;
  if (trimmed === '-inf') return -Infinity;
  if (trimmed === 'nan' || trimmed === '+nan' || trimmed === '-nan') return NaN;

  // Date / Datetime
  if (/^\d{4}-\d{2}-\d{2}(?:[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?$/.test(trimmed)) {
    return trimmed;
  }

  // Array: [ ... ]
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return parseTomlArray(trimmed.substring(1, trimmed.length - 1), line);
  }

  // Inline Table: { ... }
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return parseTomlInlineTable(trimmed.substring(1, trimmed.length - 1), line);
  }

  return trimmed;
}

function parseBasicStringContent(str: string): string {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\U([0-9a-fA-F]{8})/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)));
}

function parseTomlArray(inner: string, line: number): unknown[] {
  const items: unknown[] = [];
  let cur = '';
  let inDouble = false;
  let inSingle = false;
  let depth = 0;

  for (let i = 0; i < inner.length; i++) {
    const c = inner[i]!;
    if (c === '"' && !inSingle) inDouble = !inDouble;
    else if (c === "'" && !inDouble) inSingle = !inSingle;
    else if ((c === '[' || c === '{') && !inDouble && !inSingle) depth++;
    else if ((c === ']' || c === '}') && !inDouble && !inSingle) depth--;
    else if (c === ',' && !inDouble && !inSingle && depth === 0) {
      const item = cur.trim();
      if (item) items.push(parseTomlValue(item, line));
      cur = '';
      continue;
    }
    cur += c;
  }
  const last = cur.trim();
  if (last) items.push(parseTomlValue(last, line));
  return items;
}

function parseTomlInlineTable(inner: string, line: number): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const pairs: string[] = [];
  let cur = '';
  let inDouble = false;
  let inSingle = false;
  let depth = 0;

  for (let i = 0; i < inner.length; i++) {
    const c = inner[i]!;
    if (c === '"' && !inSingle) inDouble = !inDouble;
    else if (c === "'" && !inDouble) inSingle = !inSingle;
    else if ((c === '[' || c === '{') && !inDouble && !inSingle) depth++;
    else if ((c === ']' || c === '}') && !inDouble && !inSingle) depth--;
    else if (c === ',' && !inDouble && !inSingle && depth === 0) {
      const item = cur.trim();
      if (item) pairs.push(item);
      cur = '';
      continue;
    }
    cur += c;
  }
  const last = cur.trim();
  if (last) pairs.push(last);

  for (const pair of pairs) {
    const trimmed = pair.trim();
    if (!trimmed) continue;
    const eq = findEqualsIndex(trimmed);
    if (eq === -1) throw new TomlParseError(`Expected "=" in inline table: ${trimmed}`, { line });
    const k = unquoteKey(trimmed.substring(0, eq).trim());
    const v = trimmed.substring(eq + 1).trim();
    result[k] = parseTomlValue(v, line);
  }
  return result;
}

/**
 * Serialize a JavaScript object into TOML 1.0 format
 */
export function stringifyToml(obj: Record<string, unknown>): string {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    throw new Error('TOML root must be an object/table');
  }

  const lines: string[] = [];
  const tables: Array<{ name: string; value: Record<string, unknown> }> = [];
  const tableArrays: Array<{ name: string; items: Record<string, unknown>[] }> = [];

  // Separate top-level scalars from tables
  for (const [key, val] of Object.entries(obj)) {
    if (val === null || val === undefined) continue;

    if (Array.isArray(val)) {
      if (val.length > 0 && typeof val[0] === 'object' && val[0] !== null && !Array.isArray(val[0])) {
        tableArrays.push({ name: key, items: val as Record<string, unknown>[] });
      } else {
        lines.push(`${formatTomlKey(key)} = ${formatTomlValue(val)}`);
      }
    } else if (typeof val === 'object') {
      tables.push({ name: key, value: val as Record<string, unknown> });
    } else {
      lines.push(`${formatTomlKey(key)} = ${formatTomlValue(val)}`);
    }
  }

  // Format nested tables
  for (const table of tables) {
    if (lines.length > 0) lines.push('');
    lines.push(`[${formatTomlKey(table.name)}]`);
    serializeTableContent(table.value, table.name, lines);
  }

  // Format array of tables
  for (const arr of tableArrays) {
    for (const item of arr.items) {
      if (lines.length > 0) lines.push('');
      lines.push(`[[${formatTomlKey(arr.name)}]]`);
      serializeTableContent(item, arr.name, lines);
    }
  }

  return lines.join('\n') + '\n';
}

function serializeTableContent(
  obj: Record<string, unknown>,
  prefix: string,
  lines: string[]
) {
  const subTables: Array<{ name: string; value: Record<string, unknown> }> = [];

  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue;

    if (typeof v === 'object' && !Array.isArray(v)) {
      subTables.push({ name: `${prefix}.${k}`, value: v as Record<string, unknown> });
    } else {
      lines.push(`${formatTomlKey(k)} = ${formatTomlValue(v)}`);
    }
  }

  for (const sub of subTables) {
    lines.push('');
    lines.push(`[${sub.name}]`);
    serializeTableContent(sub.value, sub.name, lines);
  }
}

function formatTomlKey(key: string): string {
  if (/^[a-zA-Z0-9_-]+$/.test(key)) return key;
  return `"${key.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function formatTomlValue(val: unknown): string {
  if (val === null || val === undefined) return '""';
  if (typeof val === 'string') {
    return `"${val.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')}"`;
  }
  if (typeof val === 'number') {
    if (Number.isNaN(val)) return 'nan';
    if (val === Infinity) return 'inf';
    if (val === -Infinity) return '-inf';
    return String(val);
  }
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (val instanceof Date) return val.toISOString();
  if (Array.isArray(val)) {
    return `[${val.map(formatTomlValue).join(', ')}]`;
  }
  if (typeof val === 'object') {
    const pairs = Object.entries(val as Record<string, unknown>)
      .map(([k, v]) => `${formatTomlKey(k)} = ${formatTomlValue(v)}`);
    return `{ ${pairs.join(', ')} }`;
  }
  return String(val);
}
