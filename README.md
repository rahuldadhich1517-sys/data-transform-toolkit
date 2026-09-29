# data-transform-toolkit

Production-ready TypeScript toolkit for multi-format conversion, parsing, formatting, validation, and structured data comparison.

[![npm version](https://img.shields.io/npm/v/data-transform-toolkit.svg)](https://www.npmjs.com/package/data-transform-toolkit)
[![npm downloads](https://img.shields.io/npm/dm/data-transform-toolkit.svg)](https://www.npmjs.com/package/data-transform-toolkit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![CI](https://github.com/rahuldadhich1517-sys/data-transform-toolkit/actions/workflows/ci.yml/badge.svg)](https://github.com/rahuldadhich1517-sys/data-transform-toolkit/actions)

## Features

- **Zero runtime dependencies**: 100% self-contained pure TypeScript implementation with zero external runtime dependencies.
- **42+ format transformations**: Convert seamlessly between JSON, CSV, Excel (XLSX), YAML, XML, TOML, HTML, Markdown, SQL, ENV, INI, TSV, NDJSON, PLIST, and Protobuf.
- **Strictly secure**: Zero `eval()`, zero `new Function()`, zero SQL execution, safe entity decoding, prototype pollution guards, and XSS-resistant defaults.
- **Structured data comparison**: Deep diffing with path matching, type change detection, and array order controls.
- **Pure TypeScript**: Strongly typed signatures, complete type definitions, and informative custom error classes.
- **ESM & Node.js 16+**: Built with standard ES modules, tree-shakeable exports, and tested across modern Node environments.

## Installation

```bash
npm install data-transform-toolkit
```

---

## Table of Contents

- [Core Data Conversion](#core-data-conversion)
- [Environment & Configuration](#environment--configuration)
- [CSV & Delimited](#csv--delimited)
- [Excel (XLSX)](#excel-xlsx)
- [HTML](#html)
- [Markdown](#markdown)
- [XML](#xml)
- [YAML](#yaml)
- [SQL](#sql)
- [Text](#text)
- [Specialized Formats](#specialized-formats)
- [Error Handling](#error-handling)
- [Security Considerations](#security-considerations)
- [Development & Verification](#development--verification)

---

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

---

## Development & Verification

```bash
# Typecheck
npm run typecheck

# Lint with strict TypeScript
npm run lint

# Run all tests
npm test

# Build distribution
npm run build

# Verify packaging
npm pack --dry-run
```

---

## License

MIT
