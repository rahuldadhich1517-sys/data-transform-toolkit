/**
 * Protobuf Wire Format Decoder
 * Low-level wire-format decoder. Does NOT require schema (.proto) files.
 * Limitation: Does not reconstruct field names or high-level types without schemas.
 */

import { decodeProtobufBytes, type ProtobufField } from '../internal/protobuf-decoder.js';

export type { ProtobufField as ProtobufDecodedField } from '../internal/protobuf-decoder.js';

export interface ProtobufDecodeOptions {
  /** Whether to attempt recursively decoding length-delimited fields as nested messages. Defaults to true */
  recursive?: boolean;
  /** Maximum nesting depth for recursive decoding. Defaults to 10 */
  maxDepth?: number;
}

/**
 * Decode protobuf wire-format bytes into readable fields and wire types
 *
 * @param input Uint8Array, Buffer, or hex-encoded string of wire bytes
 * @param options Decode options
 * @returns Array of decoded wire fields
 */
export function protobufDecode(
  input: Uint8Array | Buffer | string,
  options: ProtobufDecodeOptions = {}
): ProtobufField[] {
  return decodeProtobufBytes(input, options);
}
