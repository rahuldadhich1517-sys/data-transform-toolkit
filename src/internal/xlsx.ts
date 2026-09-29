/**
 * Zero-dependency OpenXML (XLSX) generator and parser using standard node:zlib
 */

import { deflateRawSync, inflateRawSync } from 'node:zlib';
import { escapeXml } from './escaping.js';

// Precomputed CRC-32 IEEE 802.3 table
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  CRC_TABLE[i] = c;
}

export function crc32(buf: Uint8Array): number {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]!) & 0xFF]! ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

export interface ZipEntry {
  path: string;
  data: Buffer | Uint8Array | string;
}

/**
 * Minimal standard PKZIP 2.0 archive writer
 */
export function createZip(entries: ZipEntry[]): Buffer {
  const localHeaders: Buffer[] = [];
  const centralHeaders: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const rawData = typeof entry.data === 'string'
      ? Buffer.from(entry.data, 'utf8')
      : Buffer.isBuffer(entry.data)
      ? entry.data
      : Buffer.from(entry.data);

    const nameBuf = Buffer.from(entry.path, 'utf8');
    const uncompressedSize = rawData.length;
    const checksum = crc32(rawData);

    // Deflate raw
    const compressedData = deflateRawSync(rawData);
    const compressedSize = compressedData.length;

    // Local file header (30 bytes + name length)
    const localHeader = Buffer.alloc(30 + nameBuf.length);
    localHeader.writeUInt32LE(0x04034b50, 0); // signature
    localHeader.writeUInt16LE(20, 4);          // version needed (2.0)
    localHeader.writeUInt16LE(0x0800, 6);      // flags (UTF-8)
    localHeader.writeUInt16LE(8, 8);           // compression (deflate)
    localHeader.writeUInt16LE(0, 10);          // mod time
    localHeader.writeUInt16LE(0, 12);          // mod date
    localHeader.writeUInt32LE(checksum, 14);   // crc32
    localHeader.writeUInt32LE(compressedSize, 18);
    localHeader.writeUInt32LE(uncompressedSize, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);          // extra len
    nameBuf.copy(localHeader, 30);

    localHeaders.push(localHeader, compressedData);

    // Central directory header (46 bytes + name length)
    const centralHeader = Buffer.alloc(46 + nameBuf.length);
    centralHeader.writeUInt32LE(0x02014b50, 0); // signature
    centralHeader.writeUInt16LE(20, 4);          // version made by
    centralHeader.writeUInt16LE(20, 6);          // version needed
    centralHeader.writeUInt16LE(0x0800, 8);      // flags (UTF-8)
    centralHeader.writeUInt16LE(8, 10);          // compression (deflate)
    centralHeader.writeUInt16LE(0, 12);          // mod time
    centralHeader.writeUInt16LE(0, 14);          // mod date
    centralHeader.writeUInt32LE(checksum, 16);   // crc32
    centralHeader.writeUInt32LE(compressedSize, 20);
    centralHeader.writeUInt32LE(uncompressedSize, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);          // extra len
    centralHeader.writeUInt16LE(0, 32);          // comment len
    centralHeader.writeUInt16LE(0, 34);          // disk start
    centralHeader.writeUInt16LE(0, 36);          // int attr
    centralHeader.writeUInt32LE(0, 38);          // ext attr
    centralHeader.writeUInt32LE(offset, 42);     // relative local header offset
    nameBuf.copy(centralHeader, 46);

    centralHeaders.push(centralHeader);

    offset += localHeader.length + compressedData.length;
  }

  const centralDirSize = centralHeaders.reduce((acc, h) => acc + h.length, 0);
  const centralDirOffset = offset;

  // End of central directory record (22 bytes)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);            // signature
  eocd.writeUInt16LE(0, 4);                     // disk number
  eocd.writeUInt16LE(0, 6);                     // start disk
  eocd.writeUInt16LE(entries.length, 8);        // entries on disk
  eocd.writeUInt16LE(entries.length, 10);       // total entries
  eocd.writeUInt32LE(centralDirSize, 12);       // central dir size
  eocd.writeUInt32LE(centralDirOffset, 16);     // central dir offset
  eocd.writeUInt16LE(0, 20);                    // comment len

  return Buffer.concat([...localHeaders, ...centralHeaders, eocd]);
}

/**
 * Minimal PKZIP reader
 */
export function readZip(buffer: Buffer | Uint8Array): Record<string, Buffer> {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  const files: Record<string, Buffer> = {};

  // Search backward for End of Central Directory (0x06054b50)
  let eocdOffset = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset === -1) {
    throw new Error('Invalid ZIP archive: End of Central Directory record not found');
  }

  const entryCount = buf.readUInt16LE(eocdOffset + 10);
  const centralDirOffset = buf.readUInt32LE(eocdOffset + 16);

  let curCentral = centralDirOffset;
  for (let e = 0; e < entryCount; e++) {
    if (buf.readUInt32LE(curCentral) !== 0x02014b50) {
      break;
    }

    const compression = buf.readUInt16LE(curCentral + 10);
    const compressedSize = buf.readUInt32LE(curCentral + 20);
    const uncompressedSize = buf.readUInt32LE(curCentral + 24);
    const nameLen = buf.readUInt16LE(curCentral + 28);
    const extraLen = buf.readUInt16LE(curCentral + 30);
    const commentLen = buf.readUInt16LE(curCentral + 32);
    const localHeaderOffset = buf.readUInt32LE(curCentral + 42);

    const fileName = buf.toString('utf8', curCentral + 46, curCentral + 46 + nameLen);
    curCentral += 46 + nameLen + extraLen + commentLen;

    // Parse local header to find data offset
    if (buf.readUInt32LE(localHeaderOffset) !== 0x04034b50) {
      continue;
    }
    const localNameLen = buf.readUInt16LE(localHeaderOffset + 26);
    const localExtraLen = buf.readUInt16LE(localHeaderOffset + 28);
    const dataOffset = localHeaderOffset + 30 + localNameLen + localExtraLen;

    const slice = buf.subarray(dataOffset, dataOffset + compressedSize);
    let extracted: Buffer;
    if (compression === 0) {
      extracted = Buffer.from(slice);
    } else if (compression === 8) {
      extracted = inflateRawSync(slice);
    } else {
      throw new Error(`Unsupported ZIP compression method: ${compression}`);
    }

    files[fileName] = extracted;
    // Also store normalized slash path
    files[fileName.replace(/\\/g, '/')] = extracted;
  }

  return files;
}

/**
 * 0-based column index to Excel column string ('A', 'B', ..., 'AA', 'AB'...)
 */
export function colToLetter(colIndex: number): string {
  let temp = colIndex;
  let letter = '';
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

/**
 * Excel column string ('A', 'B', ..., 'AA') to 0-based column index
 */
export function letterToCol(colStr: string): number {
  let col = 0;
  const upper = colStr.toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    col = col * 26 + (upper.charCodeAt(i) - 64);
  }
  return col - 1;
}

export interface XlsxSheet {
  name: string;
  rows: Array<Array<unknown>>;
}

/**
 * Generate a valid XLSX workbook buffer from sheet rows
 */
export function buildXlsx(sheets: XlsxSheet[]): Buffer {
  if (sheets.length === 0) {
    sheets = [{ name: 'Sheet1', rows: [] }];
  }

  const entries: ZipEntry[] = [];

  // 1. [Content_Types].xml
  let sheetOverrides = '';
  for (let i = 0; i < sheets.length; i++) {
    sheetOverrides += `  <Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>\n`;
  }
  entries.push({
    path: '[Content_Types].xml',
    data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
${sheetOverrides}</Types>`
  });

  // 2. _rels/.rels
  entries.push({
    path: '_rels/.rels',
    data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
  });

  // 3. xl/_rels/workbook.xml.rels
  let workbookRels = '';
  for (let i = 0; i < sheets.length; i++) {
    workbookRels += `  <Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>\n`;
  }
  entries.push({
    path: 'xl/_rels/workbook.xml.rels',
    data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${workbookRels}</Relationships>`
  });

  // 4. xl/workbook.xml
  let sheetElements = '';
  for (let i = 0; i < sheets.length; i++) {
    const s = sheets[i]!;
    sheetElements += `    <sheet name="${escapeXml(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>\n`;
  }
  entries.push({
    path: 'xl/workbook.xml',
    data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
${sheetElements}  </sheets>
</workbook>`
  });

  // 5. Worksheets
  for (let sIdx = 0; sIdx < sheets.length; sIdx++) {
    const sheet = sheets[sIdx]!;
    const rowXmls: string[] = [];

    for (let rIdx = 0; rIdx < sheet.rows.length; rIdx++) {
      const row = sheet.rows[rIdx]!;
      const rowNum = rIdx + 1;
      const cellXmls: string[] = [];

      for (let cIdx = 0; cIdx < row.length; cIdx++) {
        const val = row[cIdx];
        if (val === null || val === undefined || val === '') {
          continue;
        }

        const cellRef = `${colToLetter(cIdx)}${rowNum}`;

        if (typeof val === 'number') {
          cellXmls.push(`<c r="${cellRef}"><v>${val}</v></c>`);
        } else if (typeof val === 'boolean') {
          cellXmls.push(`<c r="${cellRef}" t="b"><v>${val ? 1 : 0}</v></c>`);
        } else if (val instanceof Date) {
          // Store date as ISO string in inlineStr
          cellXmls.push(`<c r="${cellRef}" t="inlineStr"><is><t>${escapeXml(val.toISOString())}</t></is></c>`);
        } else {
          cellXmls.push(`<c r="${cellRef}" t="inlineStr"><is><t>${escapeXml(String(val))}</t></is></c>`);
        }
      }

      if (cellXmls.length > 0) {
        rowXmls.push(`    <row r="${rowNum}">\n      ${cellXmls.join('')}\n    </row>`);
      }
    }

    entries.push({
      path: `xl/worksheets/sheet${sIdx + 1}.xml`,
      data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
${rowXmls.join('\n')}
  </sheetData>
</worksheet>`
    });
  }

  return createZip(entries);
}

export interface ParsedSheet {
  sheet: string;
  data: Array<Array<unknown>>;
}

/**
 * Parse an XLSX workbook buffer into sheet data
 */
export function parseXlsx(buffer: Buffer | Uint8Array, options?: { sheet?: string | number }): ParsedSheet[] {
  const files = readZip(buffer);

  // 1. Parse shared strings if present
  const sharedStrings: string[] = [];
  const sharedStringsXml = files['xl/sharedStrings.xml']?.toString('utf8');
  if (sharedStringsXml) {
    const siRegex = /<si\b[^>]*>([\s\S]*?)<\/si>/g;
    let match: RegExpExecArray | null;
    while ((match = siRegex.exec(sharedStringsXml)) !== null) {
      const siContent = match[1]!;
      const tRegex = /<t\b[^>]*>([\s\S]*?)<\/t>/g;
      let text = '';
      let tMatch: RegExpExecArray | null;
      while ((tMatch = tRegex.exec(siContent)) !== null) {
        text += unescapeXml(tMatch[1]!);
      }
      sharedStrings.push(text);
    }
  }

  // 2. Discover sheets from xl/workbook.xml
  const workbookXml = files['xl/workbook.xml']?.toString('utf8');
  if (!workbookXml) {
    throw new Error('Invalid XLSX workbook: missing xl/workbook.xml');
  }

  // Read workbook rels to map r:id to target file
  const relsXml = files['xl/_rels/workbook.xml.rels']?.toString('utf8');
  const relMap: Record<string, string> = {};
  if (relsXml) {
    const relRegex = /<Relationship\b([^>]*)\/?>/g;
    let rMatch: RegExpExecArray | null;
    while ((rMatch = relRegex.exec(relsXml)) !== null) {
      const attrs = rMatch[1]!;
      const idMatch = attrs.match(/Id="([^"]+)"/);
      const targetMatch = attrs.match(/Target="([^"]+)"/);
      if (idMatch && targetMatch) {
        let target = targetMatch[1]!;
        if (!target.startsWith('worksheets/') && !target.startsWith('/xl/')) {
          target = 'worksheets/' + target;
        }
        relMap[idMatch[1]!] = target.replace(/^\/?(xl\/)?/, '');
      }
    }
  }

  const sheetDefs: Array<{ name: string; file: string }> = [];
  const sheetTagRegex = /<sheet\b([^>]*)\/?>/g;
  let sMatch: RegExpExecArray | null;
  let defaultIdx = 1;
  while ((sMatch = sheetTagRegex.exec(workbookXml)) !== null) {
    const attrs = sMatch[1]!;
    const nameMatch = attrs.match(/name="([^"]+)"/);
    const rIdMatch = attrs.match(/[a-zA-Z:]*id="([^"]+)"/i);

    const sheetName = nameMatch ? unescapeXml(nameMatch[1]!) : `Sheet${defaultIdx}`;
    let sheetFile = '';
    if (rIdMatch && relMap[rIdMatch[1]!]) {
      sheetFile = 'xl/' + relMap[rIdMatch[1]!];
    } else {
      sheetFile = `xl/worksheets/sheet${defaultIdx}.xml`;
    }
    sheetDefs.push({ name: sheetName, file: sheetFile });
    defaultIdx++;
  }

  const result: ParsedSheet[] = [];

  for (const def of sheetDefs) {
    const sheetXml = files[def.file]?.toString('utf8');
    if (!sheetXml) {
      result.push({ sheet: def.name, data: [] });
      continue;
    }

    const rows: Array<Array<unknown>> = [];
    const rowRegex = /<row\b([^>]*)>([\s\S]*?)<\/row>/g;
    let rowMatch: RegExpExecArray | null;

    while ((rowMatch = rowRegex.exec(sheetXml)) !== null) {
      const rowAttrs = rowMatch[1]!;
      const rowContent = rowMatch[2]!;
      const rNumMatch = rowAttrs.match(/\br="(\d+)"/);
      const rowNum = rNumMatch ? parseInt(rNumMatch[1]!, 10) : rows.length + 1;

      // Expand rows if there are gaps
      while (rows.length < rowNum - 1) {
        rows.push([]);
      }

      const rowData: unknown[] = [];
      const cellRegex = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
      let cellMatch: RegExpExecArray | null;

      while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
        const cellAttrs = cellMatch[1]!;
        const cellBody = cellMatch[2] || '';

        // Extract column index from r="A1"
        const rMatch = cellAttrs.match(/\br="([A-Za-z]+)(\d+)"/);
        let colIndex = rowData.length;
        if (rMatch) {
          colIndex = letterToCol(rMatch[1]!);
        }

        // Expand rowData if column gap
        while (rowData.length < colIndex) {
          rowData.push(null);
        }

        const typeMatch = cellAttrs.match(/\bt="([^"]+)"/);
        const cellType = typeMatch ? typeMatch[1] : '';

        let val: unknown = null;

        if (cellType === 'inlineStr') {
          const tMatch = cellBody.match(/<t\b[^>]*>([\s\S]*?)<\/t>/);
          val = tMatch ? unescapeXml(tMatch[1]!) : '';
        } else if (cellType === 's') {
          const vMatch = cellBody.match(/<v\b[^>]*>([\s\S]*?)<\/v>/);
          if (vMatch) {
            const sIdx = parseInt(vMatch[1]!, 10);
            val = sharedStrings[sIdx] ?? '';
          }
        } else if (cellType === 'b') {
          const vMatch = cellBody.match(/<v\b[^>]*>([\s\S]*?)<\/v>/);
          val = vMatch ? vMatch[1] === '1' : false;
        } else {
          const vMatch = cellBody.match(/<v\b[^>]*>([\s\S]*?)<\/v>/);
          if (vMatch) {
            const rawV = vMatch[1]!.trim();
            const num = Number(rawV);
            val = !isNaN(num) ? num : rawV;
          }
        }

        rowData[colIndex] = val;
      }

      rows.push(rowData);
    }

    result.push({ sheet: def.name, data: rows });
  }

  return result;
}

function unescapeXml(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}
