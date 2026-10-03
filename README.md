# data-transform-toolkit

Zero-runtime-dependency TypeScript toolkit for converting, parsing, formatting, validating, and diffing structured data across JSON, CSV, Excel, YAML, XML, TOML, HTML, Markdown, SQL, and configuration formats in Node.js.

[![npm version](https://img.shields.io/npm/v/data-transform-toolkit.svg)](https://www.npmjs.com/package/data-transform-toolkit)
[![npm downloads](https://img.shields.io/npm/dm/data-transform-toolkit.svg)](https://www.npmjs.com/package/data-transform-toolkit)
[![Dependencies](https://img.shields.io/badge/runtime%20dependencies-0-brightgreen)](https://www.npmjs.com/package/data-transform-toolkit)
[![Module](https://img.shields.io/badge/module-ESM-blue)](https://www.npmjs.com/package/data-transform-toolkit)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D16-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

`data-transform-toolkit` is a zero-dependency TypeScript library for converting and validating structured data in Node.js. It is designed for real-world data pipelines, application configuration handling, report generation, ETL tasks, and format interop between JSON, CSV, YAML, XML, Excel, HTML, Markdown, TOML, and SQL-like text.

The package emphasizes:

- Safe, deterministic conversion logic
- Strong TypeScript typings for all exported APIs
- No external runtime dependencies
- Node.js-first ESM usage
- Rich validation and error reporting via custom error classes

## Features

- Zero external runtime dependencies
- TypeScript-first API with generated declaration files
- ESM package for modern Node.js environments
- 50+ conversion and transformation utilities
- Structured data diffing with added/removed/changed tracking
- Configuration parsing for `.env`, INI, query strings, and NDJSON
- Excel XLSX reading and CSV export support
- XML and YAML validation, formatting, and conversion
- HTML and Markdown conversion utilities
- Custom error classes for parse and validation failures

## Quick start

```ts
import { jsonToCsv, csvToJson, dataDiff } from 'data-transform-toolkit';

const rows = [
  { id: 1, name: 'Ada Lovelace' },
  { id: 2, name: 'Grace Hopper' }
];

const csv = jsonToCsv(rows);
const parsed = csvToJson(csv);
const diff = dataDiff(
  { id: 1, name: 'Ada Lovelace' },
  { id: 1, name: 'Grace Hopper' }
);

console.log(csv);
console.log(parsed);
console.log(diff.summary);
```

## Public API summary

All public exports are available from the package root entry point.

### Core JSON conversion

- `jsonToCsv(data, options?)` — Convert JSON data to CSV text
- `csvToJson(csv, options?)` — Parse CSV text into records
- `jsonToYaml(data, options?)` — Serialize JSON to YAML
- `yamlToJson(yaml, options?)` — Parse YAML into JavaScript values
- `jsonToXml(data, options?)` — Serialize JSON to XML
- `xmlToJson(xml, options?)` — Parse XML into an object
- `dataDiff(original, modified, options?)` — Deep compare two JSON-compatible values

### Configuration and text formats

- `envToJson(envContent, options?)` — Parse `.env` content into an object
- `jsonToEnv(input, options?)` — Serialize an object to `.env` format
- `iniToJson(iniContent, options?)` — Parse INI content into nested objects
- `querystringToJson(queryString, options?)` — Parse a query string into an object
- `ndjsonToJson(ndjson, options?)` — Parse newline-delimited JSON into an array

### CSV and delimited data

- `csvToExcel(csv, options?)` — Convert CSV text to an XLSX buffer
- `csvToHtml(csv, options?)` — Render CSV as an HTML table
- `csvToMarkdown(csv, options?)` — Convert CSV to Markdown table
- `csvToSql(csv, options?)` — Generate `INSERT` statements from CSV rows
- `csvToTsv(csv, options?)` — Convert CSV to TSV
- `tsvToCsv(tsv, options?)` — Convert TSV to CSV
- `csvToXml(csv, options?)` — Convert CSV rows to XML
- `csvToYaml(csv, options?)` — Convert CSV data to YAML
- `textToCsv(text, options?)` — Detect and normalize delimited text to CSV
- `xmlToCsv(xml, options?)` — Flatten XML rows into CSV
- `sqlToCsv(sql, options?)` — Extract rows from SQL `INSERT` statements to CSV

### Excel conversion

- `excelToCsv(file, options?)` — Read an XLSX buffer and return CSV text
- `excelToJson(file, options?)` — Read an XLSX buffer and return row objects

### HTML utilities

- `htmlTableToJson(html, options?)` — Extract table data into JSON objects
- `htmlToMarkdown(html, options?)` — Convert HTML to Markdown
- `htmlToText(html, options?)` — Strip markup and return readable text
- `htmlFormatter(html, options?)` — Pretty-print HTML output

### Markdown utilities

- `markdownToHtml(markdown, options?)` — Render Markdown as HTML
- `markdownToRst(markdown, options?)` — Convert Markdown to reStructuredText
- `markdownToSlack(markdown, options?)` — Convert Markdown to Slack-flavored text
- `markdownToText(markdown, options?)` — Strip Markdown formatting to plain text

### Text utilities

- `textToHtml(text, options?)` — Escape and format plain text as HTML-safe output
- `textToJson(text, options?)` — Parse text or JSON-like values into objects

### TOML utilities

- `tomlToJson(toml, options?)` — Parse TOML into a JavaScript object
- `tomlToYaml(toml, options?)` — Convert TOML to YAML

### XML utilities

- `xmlFormat(xml, options?)` — Pretty-print XML
- `xmlToJsonParser(xml, options?)` — Parse XML to a JSON-like object
- `xmlToYaml(xml, options?)` — Convert XML to YAML
- `xmlValidate(xml, options?)` — Validate XML and return a result object

### YAML utilities

- `yamlDiff(originalYaml, modifiedYaml, options?)` — Compare YAML documents
- `yamlFormat(yaml, options?)` — Pretty-print YAML
- `yamlToProperties(yaml, options?)` — Convert YAML mappings to `.properties` format
- `yamlToToml(yaml, options?)` — Convert YAML to TOML
- `yamlValidate(yaml, options?)` — Validate YAML and return a result object

### SQL and specialized converters

- `sqlToJson(sql, options?)` — Parse SQL rows or insert statements into JSON-like objects
- `jsObjectToJson(value, options?)` — Serialize JavaScript objects to JSON text
- `plistToJson(plist, options?)` — Parse plist XML into JavaScript values
- `protobufDecode(data, options?)` — Decode protobuf binary data into JavaScript values

## Core Data Conversion

### `jsonToCsv`

Converts an array of objects into standard RFC 4180 CSV text.

```ts
function jsonToCsv(data: unknown[], options?: JsonToCsvOptions): string
```

```ts
import { jsonToCsv } from 'data-transform-toolkit';

const csv = jsonToCsv([
  { id: 1, name: 'Ada Lovelace' },
  { id: 2, name: 'Grace Hopper' }
]);
```

### `csvToJson`

Parses CSV text into an array of typed or string records.

```ts
function csvToJson(csv: string, options?: CsvToJsonOptions): CsvRecord[]
```

```ts
import { csvToJson } from 'data-transform-toolkit';

const records = csvToJson('id,name\n1,Ada\n2,Grace');
```

### `jsonToYaml` & `yamlToJson`

Bidirectional JSON ↔ YAML converter with indentation control.

```ts
function jsonToYaml(data: JsonValue, options?: JsonToYamlOptions): string
function yamlToJson(yaml: string, options?: YamlToJsonOptions): YamlValue
```

```ts
import { jsonToYaml, yamlToJson } from 'data-transform-toolkit';

const yaml = jsonToYaml({ server: { port: 8080 } });
const json = yamlToJson(yaml);
```

### `jsonToXml` & `xmlToJson`

Bidirectional JSON ↔ XML converter with attribute prefixes and CDATA support.

```ts
function jsonToXml(data: unknown, options?: JsonToXmlOptions): string
function xmlToJson(xml: string, options?: XmlToJsonOptions): Record<string, unknown>
```

```ts
import { jsonToXml, xmlToJson } from 'data-transform-toolkit';

const xml = jsonToXml({ user: { name: 'Ada' } });
const json = xmlToJson(xml);
```

### `dataDiff`

Calculates structured differences between two arbitrary data structures.

```ts
function dataDiff(original: JsonValue, modified: JsonValue, options?: DataDiffOptions): DataDiffResult
```

```ts
import { dataDiff } from 'data-transform-toolkit';

const diff = dataDiff({ a: 1, b: 2 }, { a: 1, b: 3, c: 4 });
// diff.hasChanges: true
// diff.changed: [{ path: 'b', from: 2, to: 3, ... }]
// diff.added: [{ path: 'c', value: 4, ... }]
```

---

## Environment & Configuration

### `envToJson`

Parses `.env` file content into a JSON object. Supports single/double quotes, multiline values, escaped characters, empty values, and comments.

```ts
function envToJson(envContent: string, options?: EnvToJsonOptions): Record<string, unknown>
```

```ts
import { envToJson } from 'data-transform-toolkit';

const config = envToJson(`
PORT=3000
DATABASE_URL="postgres://localhost:5432/app"
DEBUG=true
`);
```

### `jsonToEnv`

Converts flat or flattened JSON objects into `.env` file lines with safe quoting.

```ts
function jsonToEnv(input: Record<string, unknown>, options?: JsonToEnvOptions): string
```

```ts
import { jsonToEnv } from 'data-transform-toolkit';

const env = jsonToEnv({ PORT: 3000, APP_NAME: 'My App' });
// APP_NAME="My App"
// PORT=3000
```

### `iniToJson`

Parses INI configuration strings into structured JSON, supporting sections, nested sections, and duplicate-key handling.

```ts
function iniToJson(iniContent: string, options?: IniToJsonOptions): Record<string, unknown>
```

```ts
import { iniToJson } from 'data-transform-toolkit';

const cfg = iniToJson(`
[database]
host = localhost
port = 5432
`);
```

### `tomlToJson` & `tomlToYaml`

Parses standard TOML into JSON or converts TOML directly into clean YAML.

```ts
function tomlToJson(toml: string, options?: TomlToJsonOptions): Record<string, unknown>
function tomlToYaml(toml: string, options?: TomlToYamlOptions): string
```

```ts
import { tomlToJson, tomlToYaml } from 'data-transform-toolkit';

const obj = tomlToJson('title = "App"\n[owner]\nname = "Tom"');
const yaml = tomlToYaml('title = "App"\n[owner]\nname = "Tom"');
```

---

## CSV & Delimited

### `csvToExcel`

Converts CSV text into an Excel (`.xlsx`) workbook buffer.

```ts
function csvToExcel(csv: string, options?: CsvToExcelOptions): Promise<Buffer>
```

### `csvToHtml`

Renders CSV data into a semantic, securely escaped `<table>`.

```ts
function csvToHtml(csv: string, options?: CsvToHtmlOptions): string
```

### `csvToMarkdown`

Formats CSV text as an aligned Markdown table with escaped pipes.

```ts
function csvToMarkdown(csv: string, options?: CsvToMarkdownOptions): string
```

### `csvToSql`

Generates safe `INSERT INTO <table> (...) VALUES (...)` statements without executing SQL.

```ts
function csvToSql(csv: string, options?: CsvToSqlOptions): string
```

### `csvToTsv` & `tsvToCsv`

Fast bidirectional conversion between comma-separated and tab-separated values.

```ts
function csvToTsv(csv: string, options?: CsvToTsvOptions): string
function tsvToCsv(tsv: string, options?: CsvToTsvOptions): string
```

### `csvToXml` & `xmlToCsv`

Flattens XML records into CSV or wraps CSV rows into structured XML elements.

```ts
function csvToXml(csv: string, options?: CsvToXmlOptions): string
function xmlToCsv(xml: string, options?: XmlToCsvOptions): string
```

### `csvToYaml`

Converts CSV records directly into a YAML array of objects.

```ts
function csvToYaml(csv: string, options?: CsvToYamlOptions): string
```

### `textToCsv` & `sqlToCsv`

Auto-detects delimiters from raw text into CSV, or extracts rows from SQL `INSERT` statements into CSV.

```ts
function textToCsv(text: string, options?: TextToCsvOptions): string
function sqlToCsv(sql: string, options?: SqlToCsvOptions): string
```

---

## Excel (XLSX)

### `excelToCsv`

Extracts worksheet data from an XLSX Buffer / Uint8Array into clean CSV text.

```ts
function excelToCsv(file: Buffer | Uint8Array, options?: ExcelToCsvOptions): Promise<string>
```

### `excelToJson`

Converts worksheet rows into strongly typed JSON objects with automatic header deduplication.

```ts
function excelToJson(file: Buffer | Uint8Array, options?: ExcelToJsonOptions): Promise<Record<string, unknown>[]>
```

---

## HTML

### `htmlTableToJson`

Extracts `<table>` data into JSON objects without browser DOM dependencies. Handles `<thead>`, `<tbody>`, and `colspan`.

```ts
function htmlTableToJson(html: string, options?: HtmlTableToJsonOptions): Record<string, string>[] | Record<string, string>[][]
```

### `htmlToMarkdown`

Converts HTML markup (headings, lists, tables, code blocks, links, formatting) into clean Markdown.

```ts
function htmlToMarkdown(html: string, options?: HtmlToMarkdownOptions): string
```

### `htmlToText`

Strips markup, scripts, and styles, decoding HTML entities into clean, readable text.

```ts
function htmlToText(html: string, options?: HtmlToTextOptions): string
```

### `htmlFormatter`

Formats and indents HTML with proper handling for void tags and comments.

```ts
function htmlFormatter(html: string, options?: HtmlFormatterOptions): string
```

---

## Markdown

### `markdownToHtml`

Renders Markdown as safe HTML with zero external runtime dependencies.

```ts
function markdownToHtml(markdown: string, options?: MarkdownToHtmlOptions): string
```

### `markdownToRst`

Translates Markdown syntax into standard reStructuredText (RST) with proper heading underlines and directives.

```ts
function markdownToRst(markdown: string, options?: MarkdownToRstOptions): string
```

### `markdownToSlack`

Converts Markdown formatting into Slack `mrkdwn` (e.g. `*bold*`, `_italic_`, `<url|label>`).

```ts
function markdownToSlack(markdown: string, options?: MarkdownToSlackOptions): string
```

### `markdownToText`

Strips Markdown markup while retaining human-readable text and structure.

```ts
function markdownToText(markdown: string, options?: MarkdownToTextOptions): string
```

---

## XML

### `xmlFormat`

Indents and normalizes XML structure with self-closing tag handling.

```ts
function xmlFormat(xml: string, options?: XmlFormatOptions): string
```

### `xmlToJsonParser`

Dedicated parser interface exposing granular control over text keys, attribute prefixes, and number parsing.

```ts
function xmlToJsonParser(xml: string, options?: XmlToJsonParserOptions): Record<string, unknown>
```

### `xmlToYaml`

Transforms XML directly into YAML format.

```ts
function xmlToYaml(xml: string, options?: XmlToYamlOptions): string
```

### `xmlValidate`

Validates XML well-formedness and returns structured error details with line and column positions.

```ts
function xmlValidate(xml: string, options?: XmlValidateOptions): XmlValidationResult
```

---

## YAML

### `yamlDiff`

Parses two YAML documents and computes structural semantic differences.

```ts
function yamlDiff(originalYaml: string, modifiedYaml: string, options?: YamlDiffOptions): DataDiffResult
```

### `yamlFormat`

Validates and formats YAML with consistent indentation.

```ts
function yamlFormat(yaml: string, options?: YamlFormatOptions): string
```

### `yamlToProperties`

Flattens nested YAML configurations into Java `.properties` key-value pairs with escaping.

```ts
function yamlToProperties(yaml: string, options?: YamlToPropertiesOptions): string
```

### `yamlToToml`

Converts YAML data structures into TOML tables.

```ts
function yamlToToml(yaml: string, options?: YamlToTomlOptions): string
```

### `yamlValidate`

Validates YAML syntax and returns structured errors with line and column positions.

```ts
function yamlValidate(yaml: string, options?: YamlValidateOptions): YamlValidationResult
```

---

## SQL

### `sqlToJson`

Safely parses SQL `INSERT INTO` statements into arrays of JSON objects without executing SQL.

```ts
function sqlToJson(sql: string, options?: SqlToJsonOptions): Record<string, string | number | boolean | null>[]
```

---

## Text

### `textToHtml`

Converts plain text paragraphs into HTML `<p>` and `<br />` tags with full entity escaping.

```ts
function textToHtml(text: string, options?: TextToHtmlOptions): string
```

### `textToJson`

Parses line-delimited `key: value` or `key=value` text into a JSON object.

```ts
function textToJson(textContent: string, options?: TextToJsonOptions): Record<string, unknown>
```

---

## Specialized Formats

### `jsObjectToJson`

Parses JavaScript object literal syntax safely without using `eval()` or `new Function()`.

```ts
function jsObjectToJson(jsObjectStr: string, options?: JsObjectToJsonOptions): string
```

> **Security Guarantee**: Rejects function declarations, arrow functions, variable identifiers, function calls, computed properties, and template literals. Only literal data syntax is accepted.

### `plistToJson`

Converts Apple XML Property List (`.plist`) data into JSON objects. Supports `<dict>`, `<array>`, `<string>`, `<integer>`, `<real>`, `<true/>`, `<false/>`, `<date>`, and `<data>`.

```ts
function plistToJson(plistXml: string, options?: PlistToJsonOptions): unknown
```

### `protobufDecode`

Low-level wire format decoder for Protobuf byte buffers (Uint8Array, Buffer, or hex string). Decodes varint (0), fixed64 (1), length-delimited (2), and fixed32 (5).

```ts
function protobufDecode(input: Uint8Array | Buffer | string, options?: ProtobufDecodeOptions): ProtobufDecodedField[]
```

> **Limitation Note**: This is a schema-free wire decoder. Without a `.proto` schema, original field names and high-level message types cannot be inferred.

### `querystringToJson`

Parses URL query strings into JSON, handling percent-decoding, plus-as-space, and repeated keys.

```ts
function querystringToJson(queryString: string, options?: QuerystringToJsonOptions): Record<string, unknown>
```

### `ndjsonToJson`

Converts Newline-Delimited JSON (NDJSON) into an array of parsed JSON values with line-accurate error reporting.

```ts
function ndjsonToJson(ndjsonContent: string, options?: NdjsonToJsonOptions): unknown[]
```

---

## Error Handling

All toolkit errors derive from `DataTransformError` and carry actionable diagnostic information:

- `CsvParseError`
- `YamlParseError`
- `XmlParseError`
- `TomlParseError`
- `SqlParseError`
- `HtmlParseError`
- `ProtobufDecodeError`
- `JsObjectParseError`
- `IniParseError`
- `EnvParseError`
- `DataConversionError`
- `DataDiffError`
- `InvalidInputError`
- `ValidationError`
- `SecurityError`

```ts
import { xmlValidate, XmlParseError } from 'data-transform-toolkit';

const result = xmlValidate('<root><unclosed></root>');
if (!result.valid) {
  console.error(result.errors); // [{ message: '...', line: ..., column: ... }]
}
```

---

## Security Considerations

1. **No Code Execution**: `jsobject-to-json` uses an internal recursive-descent syntax parser. Code evaluation (`eval`, `new Function`) is never invoked.
2. **No SQL Execution**: `sql-to-json`, `sql-to-csv`, and `csv-to-sql` parse and generate SQL text only.
3. **Escaping by Default**: All generated HTML and XML escape special characters to mitigate injection and XSS vulnerabilities.
4. **Protobuf Loop Guard**: Protobuf varints and length-delimited slices enforce bounds checking to prevent buffer overflow or infinite decoding loops.

## Pitfalls and Limitations

- **Use ESM imports:** The package publishes an ESM entry point and does not provide a CommonJS export.
- **Await Excel conversions:** `csvToExcel`, `excelToCsv`, and `excelToJson` are asynchronous. The Excel readers accept XLSX data as a `Buffer` or `Uint8Array`; by default, they use the first worksheet.
- **Protobuf decoding needs a schema for interpretation:** `protobufDecode` reads supported wire-format fields but cannot infer field names or high-level message types without a `.proto` schema.
- **JavaScript object input must be data literals:** `jsObjectToJson` is not a JavaScript runtime or general-purpose evaluator. It rejects executable expressions such as function calls and variable identifiers.
- **SQL utilities do not run queries:** SQL helpers parse or generate SQL text; they do not connect to a database, execute statements, or verify them against a database dialect.
- **Format conversions may lose format-specific information:** Different formats represent values and metadata differently. If exact round-tripping matters, test with representative input and retain the original data where needed.
- **Node.js is the supported runtime target:** Do not assume browser or edge-runtime compatibility.

## License

MIT
