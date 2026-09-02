/**
 * Data diff types and options
 */

import type { JsonValue } from './common.js';

/** Represents a single diff item that was added */
export interface AddedItem {
  path: string;
  value: JsonValue;
  type: 'added';
}

/** Represents a single diff item that was removed */
export interface RemovedItem {
  path: string;
  value: JsonValue;
  type: 'removed';
}

/** Represents a single diff item that changed */
export interface ChangedItem {
  path: string;
  from: JsonValue;
  to: JsonValue;
  type: 'changed';
  fromType: string;
  toType: string;
}

/** Represents an item that did not change */
export interface UnchangedItem {
  path: string;
  type: 'unchanged';
}

/** Union of all diff item types */
export type DiffItem = AddedItem | RemovedItem | ChangedItem | UnchangedItem;

/** Complete diff result */
export interface DataDiffResult {
  hasChanges: boolean;
  added: AddedItem[];
  removed: RemovedItem[];
  changed: ChangedItem[];
  unchanged: UnchangedItem[];
  summary: {
    totalChanges: number;
    totalAdded: number;
    totalRemoved: number;
    totalChanged: number;
    totalUnchanged: number;
  };
}

/** Options for data diff operation */
export interface DataDiffOptions {
  /** Paths to ignore in comparison (supports wildcards) */
  ignorePaths?: string[];

  /** Keys to ignore in objects */
  ignoreKeys?: string[];

  /** Whether to include unchanged items (default: true) */
  includeUnchanged?: boolean;

  /** Maximum nesting depth (default: 100) */
  maxDepth?: number;

  /** Treat null and undefined as equal (default: false) */
  treatNullAndUndefinedAsEqual?: boolean;

  /** Case-insensitive string comparison (default: false) */
  caseInsensitive?: boolean;

  /** Ignore whitespace in string comparison (default: false) */
  ignoreWhitespace?: boolean;

  /** Compare array order (default: true) */
  compareArrayOrder?: boolean;
}

/** Path matcher for ignore patterns */
export interface PathMatcher {
  test(path: string): boolean;
}
