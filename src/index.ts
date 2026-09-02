/**
 * Data Transformation Toolkit
 * Production-ready TypeScript package for JSON, CSV, YAML, and XML conversion
 * with structured data comparison
 */

// Converters - JSON <-> CSV
export { jsonToCsv, type JsonToCsvOptions } from './converters/json-to-csv.js';
export { csvToJson, type CsvToJsonOptions } from './converters/csv-to-json.js';

// Converters - JSON <-> YAML
export { jsonToYaml, type JsonToYamlOptions } from './converters/json-to-yaml.js';
export { yamlToJson, type YamlToJsonOptions } from './converters/yaml-to-json.js';

// Converters - JSON <-> XML
export { jsonToXml, type JsonToXmlOptions } from './converters/json-to-xml.js';
export { xmlToJson, type XmlToJsonOptions } from './converters/xml-to-json.js';

// Data Diff
export { dataDiff } from './diff/data-diff.js';

// Types - Public API
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

// Error Classes - Public API
export {
  DataTransformError,
  CsvParseError,
  YamlParseError,
  XmlParseError,
  DataConversionError,
  DataDiffError,
  InvalidInputError,
  ValidationError,
  SecurityError
} from './errors/index.js';
