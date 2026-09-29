/**
 * NDJSON (Newline-Delimited JSON) to JSON Converter
 */

import { InvalidInputError } from '../errors/index.js';

export interface NdjsonToJsonOptions {
  /** If true, ignore empty lines. Defaults to true */
  ignoreEmptyLines?: boolean;
  /** If true, allow comments starting with '#' or '//'. Defaults to false */
  allowComments?: boolean;
  /** If false, collect malformed lines instead of throwing immediately. Defaults to true */
  strict?: boolean;
}

/**
 * Convert NDJSON string into an array of parsed JSON values
 */
export function ndjsonToJson(
  ndjsonContent: string,
  options: NdjsonToJsonOptions = {}
): unknown[] {
  if (typeof ndjsonContent !== 'string') {
    throw new InvalidInputError('Input must be a string');
  }

  const ignoreEmpty = options.ignoreEmptyLines !== false;
  const allowComments = options.allowComments ?? false;
  const strict = options.strict !== false;

  const lines = ndjsonContent.split(/\r?\n/);
  const result: unknown[] = [];

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const rawLine = lines[lineIndex]!;
    const line = rawLine.trim();

    if (!line) {
      if (ignoreEmpty) {
        continue;
      }
      if (strict) {
        throw new InvalidInputError(`Unexpected empty line at line ${lineIndex + 1}`, {
          context: { line: lineIndex + 1 }
        });
      }
      continue;
    }

    if (allowComments && (line.startsWith('#') || line.startsWith('//'))) {
      continue;
    }

    try {
      const parsed = JSON.parse(line);
      result.push(parsed);
    } catch (err) {
      if (strict) {
        throw new InvalidInputError(`Malformed JSON at line ${lineIndex + 1}: ${(err as Error).message}`, {
          context: { line: lineIndex + 1, content: line }
        });
      }
    }
  }

  return result;
}
