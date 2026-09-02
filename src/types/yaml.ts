/**
 * YAML-specific types and options
 */

export interface YamlOptions {
  /** Number of spaces per indentation level (default: 2) */
  indentSize?: number;

  /** Maximum nesting depth (default: 100) */
  maxDepth?: number;

  /** Prefer quotes for strings (default: false) */
  preferQuotes?: boolean;

  /** Include comments from original YAML (default: false) */
  preserveComments?: boolean;

  /** Line ending to use (default: "\n") */
  lineEnding?: string;

  /** Maximum string length (default: 1048576) */
  maxStringLength?: number;
}

export interface YamlSerializeOptions extends YamlOptions {
  /** Serialize undefined as 'null' (default: true) */
  serializeUndefined?: boolean;
}

export interface YamlParseOptions extends YamlOptions {
  /** Strict parsing mode (default: false) */
  strict?: boolean;
}

/** Represents a YAML scalar type */
export type YamlScalar = string | number | boolean | null;

/** Represents a parsed YAML structure */
export type YamlValue = 
  | YamlScalar
  | YamlMapping
  | YamlSequence;

export interface YamlMapping {
  [key: string]: YamlValue;
}

export type YamlSequence = YamlValue[];
