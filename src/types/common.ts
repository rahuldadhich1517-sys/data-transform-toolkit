/**
 * Common types used across the data transformation toolkit
 */

/** Represents a JSON-compatible value */
export type JsonValue = 
  | string 
  | number 
  | boolean 
  | null 
  | undefined
  | JsonObject 
  | JsonArray;

/** Represents a JSON object */
export interface JsonObject {
  [key: string]: JsonValue;
}

/** Represents a JSON array */
export type JsonArray = JsonValue[];

/** Generic result type for operations that may fail */
export interface Result<T, E> {
  success: boolean;
  data?: T;
  error?: E;
}

/** Configuration options for parsing/serialization */
export interface BaseOptions {
  /** Whether to throw errors or return them */
  throwErrors?: boolean;
}
