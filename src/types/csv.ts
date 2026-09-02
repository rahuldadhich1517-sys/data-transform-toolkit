/**
 * CSV-specific types and options
 */

export interface CsvOptions {
  /** Field delimiter (default: ",") */
  delimiter?: string;

  /** Whether to treat first row as headers (default: true) */
  headers?: boolean;

  /** Trim whitespace from values (default: false) */
  trim?: boolean;

  /** Attempt to parse numbers (default: false) */
  parseNumbers?: boolean;

  /** Attempt to parse booleans (default: false) */
  parseBooleans?: boolean;

  /** Line ending to use in output (default: "\n") */
  lineEnding?: string;

  /** Maximum nesting depth to prevent DOS (default: 100) */
  maxDepth?: number;

  /** Maximum field length in characters (default: 1048576) */
  maxFieldLength?: number;
}

export interface CsvParseOptions extends CsvOptions {
  /** Throw on parse errors instead of including them */
  strict?: boolean;
}

export interface CsvSerializeOptions extends CsvOptions {
  /** Quote all fields even if not necessary (default: false) */
  quoteAllFields?: boolean;

  /** Quote empty fields (default: true) */
  quoteEmptyFields?: boolean;
}

/** Represents a parsed CSV record */
export type CsvRecord = Record<string, string | null>;
