# data-transform-toolkit

Dependency-free TypeScript utilities for converting JSON, CSV, YAML, and XML, plus comparing structured data.

## Install

```bash
npm install data-transform-toolkit
```

Node.js 16 or newer is required. The package ships as native ESM with TypeScript declarations.

## Usage

```ts
import {
	csvToJson,
	dataDiff,
	jsonToCsv,
	jsonToYaml,
	jsonToXml,
	yamlToJson,
	xmlToJson
} from 'data-transform-toolkit';

const csv = jsonToCsv([
	{ name: 'Ada', age: 36 },
	{ name: 'Grace', age: 28 }
]);
const rows = csvToJson(csv);

const yaml = jsonToYaml({ rows });
const fromYaml = yamlToJson(yaml);

const xml = jsonToXml({ rows });
const fromXml = xmlToJson(xml);

const changes = dataDiff({ enabled: false }, { enabled: true });
```

All converters accept an optional format-specific options object. Operations do not mutate their inputs and throw typed errors for invalid input.

## Development

```bash
npm test
npm run typecheck
npm run build
```

The package has no runtime dependencies.
