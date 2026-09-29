/**
 * INI to JSON Converter
 */

import { IniParseError } from '../errors/index.js';

export interface IniToJsonOptions {
  /** How to handle duplicate keys within a section: 'last' (default), 'first', 'array', 'error' */
  duplicateKeyStrategy?: 'last' | 'first' | 'array' | 'error';
  /** If true, parse nested sections like [server.http] into nested objects. Defaults to true */
  nestedSections?: boolean;
  /** Section delimiter for nested sections. Defaults to '.' */
  sectionDelimiter?: string;
  /** If true, parse boolean strings ("true"/"false") and numbers. Defaults to false */
  parsePrimitives?: boolean;
}

/**
 * Convert INI configuration string into JSON object
 */
export function iniToJson(
  iniContent: string,
  options: IniToJsonOptions = {}
): Record<string, unknown> {
  if (typeof iniContent !== 'string') {
    throw new IniParseError('Input must be a string');
  }

  const dupStrategy = options.duplicateKeyStrategy ?? 'last';
  const nestedSections = options.nestedSections !== false;
  const sectionDelimiter = options.sectionDelimiter ?? '.';
  const parsePrimitives = options.parsePrimitives ?? false;

  const lines = iniContent.split(/\r?\n/);
  const result: Record<string, Record<string, unknown>> = {};
  let currentSection = '__global__';

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const rawLine = lines[lineIndex]!;
    const trimmed = rawLine.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('#')) {
      continue;
    }

    // Section header: [section]
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      const sectionName = trimmed.substring(1, trimmed.length - 1).trim();
      if (!sectionName) {
        throw new IniParseError(`Empty section header at line ${lineIndex + 1}`, { line: lineIndex + 1 });
      }
      currentSection = sectionName;
      if (!result[currentSection]) {
        result[currentSection] = {};
      }
      continue;
    }

    // Key-value pair: key=val or key: val
    const eqIdx = trimmed.indexOf('=');
    const colonIdx = trimmed.indexOf(':');
    let sepIdx = -1;

    if (eqIdx !== -1 && colonIdx !== -1) {
      sepIdx = Math.min(eqIdx, colonIdx);
    } else if (eqIdx !== -1) {
      sepIdx = eqIdx;
    } else if (colonIdx !== -1) {
      sepIdx = colonIdx;
    }

    if (sepIdx === -1) {
      throw new IniParseError(`Invalid INI line without key-value separator at line ${lineIndex + 1}`, {
        line: lineIndex + 1
      });
    }

    const rawKey = trimmed.substring(0, sepIdx).trim();
    let rawVal = trimmed.substring(sepIdx + 1).trim();

    if (!rawKey) {
      throw new IniParseError(`Empty key at line ${lineIndex + 1}`, { line: lineIndex + 1 });
    }

    // Parse quoted value or strip inline comments
    let parsedVal: unknown = '';
    if ((rawVal.startsWith('"') && rawVal.endsWith('"') && rawVal.length >= 2) ||
        (rawVal.startsWith("'") && rawVal.endsWith("'") && rawVal.length >= 2)) {
      parsedVal = rawVal.substring(1, rawVal.length - 1);
    } else {
      // Strip comments
      const commentMatch = rawVal.match(/\s+[;#]/);
      if (commentMatch && commentMatch.index !== undefined) {
        rawVal = rawVal.substring(0, commentMatch.index).trim();
      }

      if (parsePrimitives) {
        if (rawVal.toLowerCase() === 'true') parsedVal = true;
        else if (rawVal.toLowerCase() === 'false') parsedVal = false;
        else if (rawVal.toLowerCase() === 'null') parsedVal = null;
        else if (/^-?\d+(\.\d+)?$/.test(rawVal)) parsedVal = Number(rawVal);
        else parsedVal = rawVal;
      } else {
        parsedVal = rawVal;
      }
    }

    if (!result[currentSection]) {
      result[currentSection] = {};
    }

    const sectionObj = result[currentSection]!;

    if (rawKey in sectionObj) {
      if (dupStrategy === 'error') {
        throw new IniParseError(`Duplicate key "${rawKey}" in section "${currentSection}" at line ${lineIndex + 1}`, {
          line: lineIndex + 1
        });
      } else if (dupStrategy === 'first') {
        // Keep existing
      } else if (dupStrategy === 'array') {
        const existing = sectionObj[rawKey];
        if (Array.isArray(existing)) {
          existing.push(parsedVal);
        } else {
          sectionObj[rawKey] = [existing, parsedVal];
        }
      } else {
        // 'last'
        sectionObj[rawKey] = parsedVal;
      }
    } else {
      sectionObj[rawKey] = parsedVal;
    }
  }

  // If only global section, or merge global
  const finalOutput: Record<string, unknown> = {};

  // Extract global properties
  if (result['__global__']) {
    for (const [k, v] of Object.entries(result['__global__'])) {
      finalOutput[k] = v;
    }
    delete result['__global__'];
  }

  // Nest sections if enabled
  for (const [secName, secValues] of Object.entries(result)) {
    if (nestedSections && secName.includes(sectionDelimiter)) {
      const parts = secName.split(sectionDelimiter);
      let cur = finalOutput;
      for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i]!;
        if (!cur[p] || typeof cur[p] !== 'object') {
          cur[p] = {};
        }
        cur = cur[p] as Record<string, unknown>;
      }
      const lastPart = parts[parts.length - 1]!;
      cur[lastPart] = secValues;
    } else {
      finalOutput[secName] = secValues;
    }
  }

  return finalOutput;
}
