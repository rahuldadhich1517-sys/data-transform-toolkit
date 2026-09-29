/**
 * YAML Validator
 */

import { parseYaml } from '../parsers/yaml-parser.js';
import { YamlParseError } from '../errors/index.js';

export interface YamlValidationError {
  message: string;
  line?: number;
  column?: number;
}

export interface YamlValidationResult {
  valid: boolean;
  errors: YamlValidationError[];
}

export interface YamlValidateOptions {
  /** Enforce strict YAML parsing rules */
  strict?: boolean;
}

/**
 * Validate YAML syntax and return structured validation result
 */
export function yamlValidate(
  yaml: string,
  options: YamlValidateOptions = {}
): YamlValidationResult {
  if (typeof yaml !== 'string') {
    return {
      valid: false,
      errors: [{ message: 'Input must be a string' }]
    };
  }

  try {
    parseYaml(yaml, { strict: options.strict ?? true });
    return {
      valid: true,
      errors: []
    };
  } catch (err: unknown) {
    if (err instanceof YamlParseError) {
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
