/**
 * Data Transformation Toolkit
 * Production-ready TypeScript package for multi-format conversion, parsing,
 * formatting, validation, and structured data comparison.
 */

// ==========================================
// Existing Converters - JSON <-> CSV
// ==========================================
export { jsonToCsv, type JsonToCsvOptions } from './converters/json-to-csv.js';
export { csvToJson, type CsvToJsonOptions } from './converters/csv-to-json.js';

// ==========================================
// Existing Converters - JSON <-> YAML
// ==========================================
export { jsonToYaml, type JsonToYamlOptions } from './converters/json-to-yaml.js';
export { yamlToJson, type YamlToJsonOptions } from './converters/yaml-to-json.js';

// ==========================================
// Existing Converters - JSON <-> XML
// ==========================================
export { jsonToXml, type JsonToXmlOptions } from './converters/json-to-xml.js';
export { xmlToJson, type XmlToJsonOptions } from './converters/xml-to-json.js';

// ==========================================
// Existing Data Diff
// ==========================================
export { dataDiff } from './diff/data-diff.js';

// ==========================================
// Environment & Configuration Converters
// ==========================================
export { envToJson, type EnvToJsonOptions } from './converters/env-to-json.js';
export { jsonToEnv, type JsonToEnvOptions } from './converters/json-to-env.js';
export { iniToJson, type IniToJsonOptions } from './converters/ini-to-json.js';
export { querystringToJson, type QuerystringToJsonOptions } from './converters/querystring-to-json.js';
export { ndjsonToJson, type NdjsonToJsonOptions } from './converters/ndjson-to-json.js';

// ==========================================
// CSV & Delimited Converters
// ==========================================
export { csvToExcel, type CsvToExcelOptions } from './converters/csv-to-excel.js';
export { csvToHtml, type CsvToHtmlOptions } from './converters/csv-to-html.js';
export { csvToMarkdown, type CsvToMarkdownOptions, type ColumnAlignment } from './converters/csv-to-markdown.js';
export { csvToSql, type CsvToSqlOptions } from './converters/csv-to-sql.js';
export { csvToTsv, tsvToCsv, type CsvToTsvOptions } from './converters/csv-to-tsv.js';
export { csvToXml, type CsvToXmlOptions } from './converters/csv-to-xml.js';
export { csvToYaml, type CsvToYamlOptions } from './converters/csv-to-yaml.js';
export { textToCsv, type TextToCsvOptions } from './converters/text-to-csv.js';
export { xmlToCsv, type XmlToCsvOptions } from './converters/xml-to-csv.js';
export { sqlToCsv, type SqlToCsvOptions } from './converters/sql-to-csv.js';

// ==========================================
// Excel Converters
// ==========================================
export { excelToCsv, type ExcelToCsvOptions } from './converters/excel-to-csv.js';
export { excelToJson, type ExcelToJsonOptions } from './converters/excel-to-json.js';

// ==========================================
// HTML Converters & Formatter
// ==========================================
export { htmlTableToJson, type HtmlTableToJsonOptions } from './converters/html-table-to-json.js';
export { htmlToMarkdown, type HtmlToMarkdownOptions } from './converters/html-to-markdown.js';
export { htmlToText, type HtmlToTextOptions } from './converters/html-to-text.js';
export { htmlFormatter, type HtmlFormatterOptions } from './converters/html-formatter.js';

// ==========================================
// Markdown Converters
// ==========================================
export { markdownToHtml, type MarkdownToHtmlOptions } from './converters/markdown-to-html.js';
export { markdownToRst, type MarkdownToRstOptions } from './converters/markdown-to-rst.js';
export { markdownToSlack, type MarkdownToSlackOptions } from './converters/markdown-to-slack.js';
export { markdownToText, type MarkdownToTextOptions } from './converters/markdown-to-text.js';

// ==========================================
// Plain Text Converters
// ==========================================
export { textToHtml, type TextToHtmlOptions } from './converters/text-to-html.js';
export { textToJson, type TextToJsonOptions } from './converters/text-to-json.js';

// ==========================================
// TOML Converters
// ==========================================
export { tomlToJson, type TomlToJsonOptions } from './converters/toml-to-json.js';
export { tomlToYaml, type TomlToYamlOptions } from './converters/toml-to-yaml.js';

// ==========================================
// XML Converters & Validation
// ==========================================
export { xmlFormat, type XmlFormatOptions } from './converters/xml-format.js';
export { xmlToJsonParser, type XmlToJsonParserOptions } from './converters/xml-to-json-parser.js';
export { xmlToYaml, type XmlToYamlOptions } from './converters/xml-to-yaml.js';
export { xmlValidate, type XmlValidateOptions, type XmlValidationResult, type XmlValidationError } from './converters/xml-validate.js';

// ==========================================
// YAML Converters, Diff & Validation
// ==========================================
export { yamlDiff, type YamlDiffOptions } from './diff/yaml-diff.js';
export { yamlFormat, type YamlFormatOptions } from './converters/yaml-format.js';
export { yamlToProperties, type YamlToPropertiesOptions } from './converters/yaml-to-properties.js';
export { yamlToToml, type YamlToTomlOptions } from './converters/yaml-to-toml.js';
export { yamlValidate, type YamlValidateOptions, type YamlValidationResult, type YamlValidationError } from './converters/yaml-validate.js';

// ==========================================
// SQL & Specialized Converters
// ==========================================
export { sqlToJson, type SqlToJsonOptions } from './converters/sql-to-json.js';
export { jsObjectToJson, type JsObjectToJsonOptions } from './converters/jsobject-to-json.js';
export { plistToJson, type PlistToJsonOptions } from './converters/plist-to-json.js';
export { protobufDecode, type ProtobufDecodeOptions, type ProtobufDecodedField } from './converters/protobuf-decode.js';

// ==========================================
// Types - Public API
// ==========================================
export type {
  JsonValue,
  JsonObject,
  JsonArray,
  Result,
  BaseOptions
} from './types/common.js';

export type {
  CsvOptions,
  CsvParseOptions,
  CsvSerializeOptions,
  CsvRecord
} from './types/csv.js';

export type {
  YamlOptions,
  YamlSerializeOptions,
  YamlParseOptions,
  YamlScalar,
  YamlValue,
  YamlMapping,
  YamlSequence
} from './types/yaml.js';

export type {
  XmlOptions,
  XmlSerializeOptions,
  XmlParseOptions,
  XmlElement,
  XmlNode,
  XmlComment,
  XmlCdata,
  XmlValue
} from './types/xml.js';

export type {
  AddedItem,
  RemovedItem,
  ChangedItem,
  UnchangedItem,
  DiffItem,
  DataDiffResult,
  DataDiffOptions,
  PathMatcher
} from './types/diff.js';

// ==========================================
// Error Classes - Public API
// ==========================================
export {
  DataTransformError,
  CsvParseError,
  YamlParseError,
  XmlParseError,
  DataConversionError,
  DataDiffError,
  InvalidInputError,
  ValidationError,
  SecurityError,
  TomlParseError,
  SqlParseError,
  HtmlParseError,
  ProtobufDecodeError,
  JsObjectParseError,
  IniParseError,
  EnvParseError
} from './errors/index.js';
