/**
 * XML Validator
 * Validates XML well-formedness without full XSD schema compilation.
 */

import { parseXml } from '../parsers/xml-parser.js';
import { XmlParseError } from '../errors/index.js';

export interface XmlValidationError {
  message: string;
  line?: number;
  column?: number;
}

export interface XmlValidationResult {
  valid: boolean;
  errors: XmlValidationError[];
}

export interface XmlValidateOptions {
  /** Maximum nesting depth. Defaults to 100 */
  maxDepth?: number;
}

/**
 * Validate XML well-formedness and return structured validation result
 */
export function xmlValidate(
  xml: string,
  options: XmlValidateOptions = {}
): XmlValidationResult {
  if (typeof xml !== 'string') {
    return {
      valid: false,
      errors: [{ message: 'Input must be a string' }]
    };
  }

  const trimmed = xml.trim();
  if (!trimmed) {
    return {
      valid: false,
      errors: [{ message: 'Empty XML input' }]
    };
  }

  try {
    parseXml(xml, {
      strict: true,
      maxDepth: options.maxDepth ?? 100
    });

    return {
      valid: true,
      errors: []
    };
  } catch (err: unknown) {
    if (err instanceof XmlParseError) {
      return {
        valid: false,
        errors: [
          {
            message: err.message,
            line: err.line,
            column: err.column
          }
        ]
      };
    }

    return {
      valid: false,
      errors: [
        {
          message: err instanceof Error ? err.message : String(err)
        }
      ]
    };
  }
}
