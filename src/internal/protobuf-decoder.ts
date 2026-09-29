/**
 * Low-level Protobuf wire-format decoder
 * Decodes field numbers, wire types, and raw values from bytes without requiring .proto schemas.
 */

import { ProtobufDecodeError } from '../errors/index.js';

export interface ProtobufField {
  fieldNumber: number;
  wireType: number;
  wireTypeName: string;
  value: unknown;
}

export function decodeProtobufBytes(
  input: Uint8Array | Buffer | string,
  options: { recursive?: boolean; maxDepth?: number } = {}
): ProtobufField[] {
  let bytes: Uint8Array;

  if (typeof input === 'string') {
    // Hex string
    const cleanHex = input.replace(/\s+/g, '');
    if (!/^[0-9a-fA-F]*$/.test(cleanHex) || cleanHex.length % 2 !== 0) {
      throw new ProtobufDecodeError('Input string must be a valid even-length hex string');
    }
    bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < cleanHex.length; i += 2) {
      bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
    }
  } else if (input instanceof Uint8Array) {
    bytes = input;
  } else {
    throw new ProtobufDecodeError('Input must be a Uint8Array, Buffer, or hex string');
  }

  const recursive = options.recursive !== false;
  const maxDepth = options.maxDepth ?? 10;

  return decodeWireFields(bytes, 0, bytes.length, 0, recursive, maxDepth);
}

function decodeWireFields(
  bytes: Uint8Array,
  start: number,
  end: number,
  depth: number,
  recursive: boolean,
  maxDepth: number
): ProtobufField[] {
  const fields: ProtobufField[] = [];
  let i = start;

  while (i < end) {
    const keyOffset = i;
    // Read tag (varint)
    const { value: tag, nextIndex: iAfterTag } = readVarint(bytes, i, end);
    i = iAfterTag;

    const wireType = Number(tag & 7n);
    const fieldNumber = Number(tag >> 3n);

    if (fieldNumber === 0) {
      throw new ProtobufDecodeError('Invalid protobuf field number 0', { offset: keyOffset });
    }

    let wireTypeName = 'unknown';
    let value: unknown = null;

    switch (wireType) {
      case 0: { // Varint
        wireTypeName = 'varint';
        const { value: v, nextIndex } = readVarint(bytes, i, end);
        i = nextIndex;
        // Convert to Number if within safe integer range, else string
        value = v <= BigInt(Number.MAX_SAFE_INTEGER) && v >= BigInt(Number.MIN_SAFE_INTEGER)
          ? Number(v)
          : v.toString();
        break;
      }
      case 1: { // 64-bit fixed
        wireTypeName = 'fixed64';
        if (i + 8 > end) {
          throw new ProtobufDecodeError('Truncated 64-bit fixed field', { offset: i });
        }
        const view = new DataView(bytes.buffer, bytes.byteOffset + i, 8);
        const bigintVal = view.getBigUint64(0, true);
        value = bigintVal.toString();
        i += 8;
        break;
      }
      case 2: { // Length-delimited
        wireTypeName = 'length-delimited';
        const { value: lengthBig, nextIndex } = readVarint(bytes, i, end);
        const length = Number(lengthBig);
        i = nextIndex;
        if (i + length > end) {
          throw new ProtobufDecodeError(`Truncated length-delimited field: expected ${length} bytes`, { offset: i });
        }
        const slice = bytes.subarray(i, i + length);
        i += length;

        // Try decoding as nested message if enabled and depth < maxDepth
        if (recursive && depth < maxDepth && length > 0) {
          try {
            const nested = decodeWireFields(slice, 0, slice.length, depth + 1, recursive, maxDepth);
            if (nested.length > 0) {
              value = nested;
              break;
            }
          } catch {
            // Not a nested message, fall back to string or hex
          }
        }

        // Try decoding as UTF-8 string
        try {
          const decoder = new TextDecoder('utf-8', { fatal: true });
          value = decoder.decode(slice);
        } catch {
          // Fall back to hex representation
          value = Array.from(slice).map(b => b.toString(16).padStart(2, '0')).join('');
        }
        break;
      }
      case 5: { // 32-bit fixed
        wireTypeName = 'fixed32';
        if (i + 4 > end) {
          throw new ProtobufDecodeError('Truncated 32-bit fixed field', { offset: i });
        }
        const view = new DataView(bytes.buffer, bytes.byteOffset + i, 4);
        value = view.getUint32(0, true);
        i += 4;
        break;
      }
      default:
        throw new ProtobufDecodeError(`Unsupported or invalid protobuf wire type: ${wireType}`, {
          offset: keyOffset,
          context: { wireType, fieldNumber }
        });
    }

    fields.push({
      fieldNumber,
      wireType,
      wireTypeName,
      value
    });
  }

  return fields;
}

function readVarint(bytes: Uint8Array, start: number, end: number): { value: bigint; nextIndex: number } {
  let result = 0n;
  let shift = 0n;
  let i = start;

  while (i < end) {
    if (i - start >= 10) {
      throw new ProtobufDecodeError('Varint exceeds 10 bytes (overflow)', { offset: start });
    }
    const byte = bytes[i]!;
    i++;
    result |= BigInt(byte & 0x7f) << shift;
    shift += 7n;
    if ((byte & 0x80) === 0) {
      return { value: result, nextIndex: i };
    }
  }

  throw new ProtobufDecodeError('Truncated varint in protobuf stream', { offset: start });
}
