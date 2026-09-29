/**
 * CSV to XML Converter
 */

import { parseCsv } from '../parsers/csv-parser.js';
import { escapeXml, isValidXmlName } from '../internal/escaping.js';
import { InvalidInputError } from '../errors/index.js';

export interface CsvToXmlOptions {
  /** Name of the XML root element. Defaults to 'root' */
  rootElement?: string;
  /** Name of each row element. Defaults to 'row' */
  rowElement?: string;
  /** Delimiter used in the CSV. Defaults to ',' */
  delimiter?: string;
  /** Indentation spaces. Defaults to 2 */
  indent?: number;
  /** Whether to include XML declaration. Defaults to false */
  includeDeclaration?: boolean;
}

/**
 * Convert CSV text into an XML string
 */
export function csvToXml(
  csv: string,
  options: CsvToXmlOptions = {}
): string {
  if (typeof csv !== 'string') {
    throw new InvalidInputError('Input must be a string');
  }

  const trimmed = csv.trim();
  const rootName = options.rootElement ?? 'root';
  const rowName = options.rowElement ?? 'row';
  const indentSize = options.indent ?? 2;
  const pad = ' '.repeat(indentSize);

  if (!isValidXmlName(rootName)) {
    throw new InvalidInputError(`Invalid XML root element name: "${rootName}"`);
  }
  if (!isValidXmlName(rowName)) {
    throw new InvalidInputError(`Invalid XML row element name: "${rowName}"`);
  }

  if (!trimmed) {
    const emptyXml = `<${rootName}></${rootName}>`;
    return options.includeDeclaration ? `<?xml version="1.0" encoding="UTF-8"?>\n${emptyXml}` : emptyXml;
  }

  const records = parseCsv(csv, {
    delimiter: options.delimiter ?? ',',
    headers: true,
    parseNumbers: false,
    parseBooleans: false
  });

  const lines: string[] = [];
  if (options.includeDeclaration) {
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  }

  lines.push(`<${rootName}>`);

  for (const record of records) {
    lines.push(`${pad}<${rowName}>`);

    for (const [key, val] of Object.entries(record)) {
      // Sanitize tag name
      const sanitizedTag = key.trim().replace(/[^a-zA-Z0-9_.-]/g, '_');
      const validTag = isValidXmlName(sanitizedTag) ? sanitizedTag : `field_${sanitizedTag}`;

      if (val === null || val === undefined || val === '') {
        lines.push(`${pad}${pad}<${validTag}/>`);
      } else {
        lines.push(`${pad}${pad}<${validTag}>${escapeXml(String(val))}</${validTag}>`);
      }
    }

    lines.push(`${pad}</${rowName}>`);
  }

  lines.push(`</${rootName}>`);

  return lines.join('\n');
}
