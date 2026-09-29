/**
 * Custom error classes for data transformation toolkit
 */

/** Base error class for all toolkit errors */
export class DataTransformError extends Error {
  public readonly code: string;
  public readonly context: Record<string, unknown>;

  constructor(message: string, code: string, context: Record<string, unknown> = {}) {
    super(message);
    this.name = 'DataTransformError';
    this.code = code;
    this.context = context;
    Object.setPrototypeOf(this, DataTransformError.prototype);
  }

  public toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context
    };
  }
}

/** Error thrown during CSV parsing */
export class CsvParseError extends DataTransformError {
  public readonly line?: number;
  public readonly column?: number;
  public readonly content?: string;

  constructor(
    message: string,
    options: {
      line?: number;
      column?: number;
      content?: string;
      context?: Record<string, unknown>;
    } = {}
  ) {
    const context = {
      ...options.context,
      line: options.line,
      column: options.column
    };
    super(message, 'CSV_PARSE_ERROR', context);
    this.name = 'CsvParseError';
    this.line = options.line;
    this.column = options.column;
    this.content = options.content;
    Object.setPrototypeOf(this, CsvParseError.prototype);
  }
}

/** Error thrown during YAML parsing */
export class YamlParseError extends DataTransformError {
  public readonly line?: number;
  public readonly column?: number;

  constructor(
    message: string,
    options: {
      line?: number;
      column?: number;
      context?: Record<string, unknown>;
    } = {}
  ) {
    const context = {
      ...options.context,
      line: options.line,
      column: options.column
    };
    super(message, 'YAML_PARSE_ERROR', context);
    this.name = 'YamlParseError';
    this.line = options.line;
    this.column = options.column;
    Object.setPrototypeOf(this, YamlParseError.prototype);
  }
}

/** Error thrown during XML parsing */
export class XmlParseError extends DataTransformError {
  public readonly line?: number;
  public readonly column?: number;
  public readonly position?: number;

  constructor(
    message: string,
    options: {
      line?: number;
      column?: number;
      position?: number;
      context?: Record<string, unknown>;
    } = {}
  ) {
    const context = {
      ...options.context,
      line: options.line,
      column: options.column,
      position: options.position
    };
    super(message, 'XML_PARSE_ERROR', context);
    this.name = 'XmlParseError';
    this.line = options.line;
    this.column = options.column;
    this.position = options.position;
    Object.setPrototypeOf(this, XmlParseError.prototype);
  }
}

/** Error thrown during data conversion */
export class DataConversionError extends DataTransformError {
  constructor(
    message: string,
    options: {
      from?: string;
      to?: string;
      context?: Record<string, unknown>;
    } = {}
  ) {
    const context = {
      ...options.context,
      from: options.from,
      to: options.to
    };
    super(message, 'DATA_CONVERSION_ERROR', context);
    this.name = 'DataConversionError';
    Object.setPrototypeOf(this, DataConversionError.prototype);
  }
}

/** Error thrown during data diff operation */
export class DataDiffError extends DataTransformError {
  constructor(
    message: string,
    options: {
      context?: Record<string, unknown>;
    } = {}
  ) {
    super(message, 'DATA_DIFF_ERROR', options.context || {});
    this.name = 'DataDiffError';
    Object.setPrototypeOf(this, DataDiffError.prototype);
  }
}

/** Error for invalid input */
export class InvalidInputError extends DataTransformError {
  constructor(
    message: string,
    options: {
      expected?: string;
      received?: string;
      context?: Record<string, unknown>;
    } = {}
  ) {
    const context = {
      ...options.context,
      expected: options.expected,
      received: options.received
    };
    super(message, 'INVALID_INPUT_ERROR', context);
    this.name = 'InvalidInputError';
    Object.setPrototypeOf(this, InvalidInputError.prototype);
  }
}

/** Error for validation failures */
export class ValidationError extends DataTransformError {
  constructor(
    message: string,
    options: {
      field?: string;
      value?: unknown;
      context?: Record<string, unknown>;
    } = {}
  ) {
    const context = {
      ...options.context,
      field: options.field,
      value: options.value
    };
    super(message, 'VALIDATION_ERROR', context);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/** Error for security violations */
export class SecurityError extends DataTransformError {
  constructor(
    message: string,
    options: {
      violation?: string;
      context?: Record<string, unknown>;
    } = {}
  ) {
    const context = {
      ...options.context,
      violation: options.violation
    };
    super(message, 'SECURITY_ERROR', context);
    this.name = 'SecurityError';
    Object.setPrototypeOf(this, SecurityError.prototype);
  }
}

/** Error thrown during TOML parsing */
export class TomlParseError extends DataTransformError {
  public readonly line?: number;
  public readonly column?: number;

  constructor(
    message: string,
    options: {
      line?: number;
      column?: number;
      context?: Record<string, unknown>;
    } = {}
  ) {
    const context = {
      ...options.context,
      line: options.line,
      column: options.column
    };
    super(message, 'TOML_PARSE_ERROR', context);
    this.name = 'TomlParseError';
    this.line = options.line;
    this.column = options.column;
    Object.setPrototypeOf(this, TomlParseError.prototype);
  }
}

/** Error thrown during SQL parsing */
export class SqlParseError extends DataTransformError {
  public readonly line?: number;
  public readonly column?: number;

  constructor(
    message: string,
    options: {
      line?: number;
      column?: number;
      context?: Record<string, unknown>;
    } = {}
  ) {
    const context = {
      ...options.context,
      line: options.line,
      column: options.column
    };
    super(message, 'SQL_PARSE_ERROR', context);
    this.name = 'SqlParseError';
    this.line = options.line;
    this.column = options.column;
    Object.setPrototypeOf(this, SqlParseError.prototype);
  }
}

/** Error thrown during HTML parsing */
export class HtmlParseError extends DataTransformError {
  public readonly line?: number;
  public readonly column?: number;

  constructor(
    message: string,
    options: {
      line?: number;
      column?: number;
      context?: Record<string, unknown>;
    } = {}
  ) {
    const context = {
      ...options.context,
      line: options.line,
      column: options.column
    };
    super(message, 'HTML_PARSE_ERROR', context);
    this.name = 'HtmlParseError';
    this.line = options.line;
    this.column = options.column;
    Object.setPrototypeOf(this, HtmlParseError.prototype);
  }
}

/** Error thrown during protobuf decoding */
export class ProtobufDecodeError extends DataTransformError {
  public readonly offset?: number;

  constructor(
    message: string,
    options: {
      offset?: number;
      context?: Record<string, unknown>;
    } = {}
  ) {
    const context = {
      ...options.context,
      offset: options.offset
    };
    super(message, 'PROTOBUF_DECODE_ERROR', context);
    this.name = 'ProtobufDecodeError';
    this.offset = options.offset;
    Object.setPrototypeOf(this, ProtobufDecodeError.prototype);
  }
}

/** Error thrown during JS object parsing */
export class JsObjectParseError extends DataTransformError {
  public readonly line?: number;
  public readonly column?: number;

  constructor(
    message: string,
    options: {
      line?: number;
      column?: number;
      context?: Record<string, unknown>;
    } = {}
  ) {
    const context = {
      ...options.context,
      line: options.line,
      column: options.column
    };
    super(message, 'JSOBJECT_PARSE_ERROR', context);
    this.name = 'JsObjectParseError';
    this.line = options.line;
    this.column = options.column;
    Object.setPrototypeOf(this, JsObjectParseError.prototype);
  }
}

/** Error thrown during INI parsing */
export class IniParseError extends DataTransformError {
  public readonly line?: number;

  constructor(
    message: string,
    options: {
      line?: number;
      context?: Record<string, unknown>;
    } = {}
  ) {
    const context = {
      ...options.context,
      line: options.line
    };
    super(message, 'INI_PARSE_ERROR', context);
    this.name = 'IniParseError';
    this.line = options.line;
    Object.setPrototypeOf(this, IniParseError.prototype);
  }
}

/** Error thrown during ENV parsing */
export class EnvParseError extends DataTransformError {
  public readonly line?: number;

  constructor(
    message: string,
    options: {
      line?: number;
      context?: Record<string, unknown>;
    } = {}
  ) {
    const context = {
      ...options.context,
      line: options.line
    };
    super(message, 'ENV_PARSE_ERROR', context);
    this.name = 'EnvParseError';
    this.line = options.line;
    Object.setPrototypeOf(this, EnvParseError.prototype);
  }
}

