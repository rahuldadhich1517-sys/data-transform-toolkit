/**
 * YAML Diff Utility
 * Compares two YAML documents structurally using the dataDiff engine.
 */

import { parseYaml } from '../parsers/yaml-parser.js';
import { dataDiff } from './data-diff.js';
import type { DataDiffOptions, DataDiffResult } from '../types/diff.js';
import { InvalidInputError } from '../errors/index.js';

export interface YamlDiffOptions extends DataDiffOptions {
  // Configurable options
}

/**
 * Compare two YAML strings structurally and return differences
 */
export function yamlDiff(
  originalYaml: string,
  modifiedYaml: string,
  options: YamlDiffOptions = {}
): DataDiffResult {
  if (typeof originalYaml !== 'string' || typeof modifiedYaml !== 'string') {
    throw new InvalidInputError('Both original and modified YAML inputs must be strings');
  }

  const originalData = parseYaml(originalYaml);
  const modifiedData = parseYaml(modifiedYaml);

  return dataDiff(originalData, modifiedData, options);
}
