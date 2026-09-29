/**
 * JavaScript Object Literal to JSON Converter
 * NEVER uses eval() or new Function(). Parses data syntax safely.
 */

import { parseJsObjectLiteral } from '../internal/jsobject-parser.js';
import { InvalidInputError } from '../errors/index.js';

export interface JsObjectToJsonOptions {
  /** If true, return formatted JSON string with indentation. Defaults to false */
  pretty?: boolean;
  /** Number of spaces for indentation when pretty=true. Defaults to 2 */
  indent?: number;
}

/**
 * Safely parse a JavaScript object literal string and convert to valid JSON string
 */
export function jsObjectToJson(
  jsObjectStr: string,
  options: JsObjectToJsonOptions = {}
): string {
  if (typeof jsObjectStr !== 'string') {
    throw new InvalidInputError('Input must be a string');
  }

  const parsed = parseJsObjectLiteral(jsObjectStr);
  const indent = options.pretty ? (options.indent ?? 2) : undefined;

  return JSON.stringify(parsed, null, indent);
}
