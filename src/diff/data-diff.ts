/**
 * Data Diff Engine - Compares two data structures and reports differences
 */

import {
  DataDiffOptions,
  DataDiffResult,
  AddedItem,
  RemovedItem,
  ChangedItem,
  UnchangedItem
} from '../types/diff.js';
import type { JsonValue, JsonObject } from '../types/common.js';
import { DataDiffError } from '../errors/index.js';

export class DataDiffEngine {
  private readonly ignorePaths: Set<string> = new Set();
  private readonly ignoreKeys: Set<string> = new Set();
  private readonly includeUnchanged: boolean;
  private readonly maxDepth: number;
  private readonly treatNullAndUndefinedAsEqual: boolean;
  private readonly caseInsensitive: boolean;
  private readonly ignoreWhitespace: boolean;
  private readonly compareArrayOrder: boolean;
  private depth = 0;

  constructor(options: DataDiffOptions = {}) {
    if (options.ignorePaths) {
      for (const path of options.ignorePaths) {
        this.ignorePaths.add(path);
      }
    }

    if (options.ignoreKeys) {
      for (const key of options.ignoreKeys) {
        this.ignoreKeys.add(key);
      }
    }

    this.includeUnchanged = options.includeUnchanged !== false;
    this.maxDepth = options.maxDepth ?? 100;
    this.treatNullAndUndefinedAsEqual = options.treatNullAndUndefinedAsEqual ?? false;
    this.caseInsensitive = options.caseInsensitive ?? false;
    this.ignoreWhitespace = options.ignoreWhitespace ?? false;
    this.compareArrayOrder = options.compareArrayOrder !== false;
  }

  public diff(original: JsonValue, modified: JsonValue): DataDiffResult {
    if (this.depth >= this.maxDepth) {
      throw new DataDiffError('Maximum nesting depth exceeded', {
        context: { maxDepth: this.maxDepth }
      });
    }

    const added: AddedItem[] = [];
    const removed: RemovedItem[] = [];
    const changed: ChangedItem[] = [];
    const unchanged: UnchangedItem[] = [];

    this.compareValues(original, modified, '', added, removed, changed, unchanged);

    const result: DataDiffResult = {
      hasChanges: added.length > 0 || removed.length > 0 || changed.length > 0,
      added,
      removed,
      changed,
      unchanged,
      summary: {
        totalChanges: added.length + removed.length + changed.length,
        totalAdded: added.length,
        totalRemoved: removed.length,
        totalChanged: changed.length,
        totalUnchanged: unchanged.length
      }
    };

    return result;
  }

  private compareValues(
    original: JsonValue,
    modified: JsonValue,
    path: string,
    added: AddedItem[],
    removed: RemovedItem[],
    changed: ChangedItem[],
    unchanged: UnchangedItem[]
  ): void {
    if (this.shouldIgnorePath(path)) {
      return;
    }

    const originalType = this.getType(original);
    const modifiedType = this.getType(modified);

    // Check if types are different
    if (originalType !== modifiedType) {
      if (this.treatNullAndUndefinedAsEqual && ((original === null && modified === undefined) || (original === undefined && modified === null))) {
        if (this.includeUnchanged) {
          unchanged.push({ path: path || '/', type: 'unchanged' });
        }
      } else {
        changed.push({
          path: path || '/',
          from: original,
          to: modified,
          type: 'changed',
          fromType: originalType,
          toType: modifiedType
        });
      }
      return;
    }

    // Same type - compare values
    if (originalType === 'object') {
      this.compareObjects(original as JsonObject, modified as JsonObject, path, added, removed, changed, unchanged);
    } else if (originalType === 'array') {
      this.compareArrays(original as JsonValue[], modified as JsonValue[], path, added, removed, changed, unchanged);
    } else if (originalType === 'string') {
      this.compareStrings(original as string, modified as string, path, added, removed, changed, unchanged);
    } else if (this.deepEqual(original, modified)) {
      if (this.includeUnchanged) {
        unchanged.push({ path: path || '/', type: 'unchanged' });
      }
    } else {
      changed.push({
        path: path || '/',
        from: original,
        to: modified,
        type: 'changed',
        fromType: originalType,
        toType: modifiedType
      });
    }
  }

  private compareObjects(
    original: JsonObject,
    modified: JsonObject,
    basePath: string,
    added: AddedItem[],
    removed: RemovedItem[],
    changed: ChangedItem[],
    unchanged: UnchangedItem[]
  ): void {
    if (this.depth >= this.maxDepth) {
      throw new DataDiffError('Maximum nesting depth exceeded', {
        context: { maxDepth: this.maxDepth }
      });
    }

    this.depth++;

    const originalKeys = new Set(Object.keys(original));
    const modifiedKeys = new Set(Object.keys(modified));

    // Find removed and changed keys
    for (const key of originalKeys) {
      if (this.ignoreKeys.has(key)) {
        continue;
      }

      const path = basePath ? `${basePath}.${key}` : key;

      if (modifiedKeys.has(key)) {
        this.compareValues(
          original[key],
          modified[key],
          path,
          added,
          removed,
          changed,
          unchanged
        );
      } else {
        removed.push({
          path,
          value: original[key],
          type: 'removed'
        });
      }
    }

    // Find added keys
    for (const key of modifiedKeys) {
      if (this.ignoreKeys.has(key)) {
        continue;
      }

      if (!originalKeys.has(key)) {
        const path = basePath ? `${basePath}.${key}` : key;
        added.push({
          path,
          value: modified[key],
          type: 'added'
        });
      }
    }

    this.depth--;
  }

  private compareArrays(
    original: JsonValue[],
    modified: JsonValue[],
    basePath: string,
    added: AddedItem[],
    removed: RemovedItem[],
    changed: ChangedItem[],
    unchanged: UnchangedItem[]
  ): void {
    if (this.depth >= this.maxDepth) {
      throw new DataDiffError('Maximum nesting depth exceeded', {
        context: { maxDepth: this.maxDepth }
      });
    }

    this.depth++;

    if (this.compareArrayOrder) {
      // Compare arrays by position
      const maxLength = Math.max(original.length, modified.length);

      for (let i = 0; i < maxLength; i++) {
        const path = `${basePath}[${i}]`;

        if (i < original.length && i < modified.length) {
          this.compareValues(
            original[i],
            modified[i],
            path,
            added,
            removed,
            changed,
            unchanged
          );
        } else if (i < original.length) {
          removed.push({
            path,
            value: original[i],
            type: 'removed'
          });
        } else {
          added.push({
            path,
            value: modified[i],
            type: 'added'
          });
        }
      }
    } else {
      // Compare arrays by set (ignoring order)
      const originalCopy = [...original];
      const modifiedCopy = [...modified];

      for (let i = 0; i < modifiedCopy.length; i++) {
        let found = false;
        for (let j = 0; j < originalCopy.length; j++) {
          if (this.deepEqual(modifiedCopy[i], originalCopy[j])) {
            originalCopy.splice(j, 1);
            found = true;
            break;
          }
        }
        if (!found) {
          added.push({
            path: `${basePath}[${i}]`,
            value: modifiedCopy[i],
            type: 'added'
          });
        }
      }

      for (const item of originalCopy) {
        removed.push({
          path: basePath,
          value: item,
          type: 'removed'
        });
      }
    }

    this.depth--;
  }

  private compareStrings(
    original: string,
    modified: string,
    path: string,
    _added: AddedItem[],
    _removed: RemovedItem[],
    changed: ChangedItem[],
    unchanged: UnchangedItem[]
  ): void {
    let origStr = original;
    let modStr = modified;

    if (this.caseInsensitive) {
      origStr = origStr.toLowerCase();
      modStr = modStr.toLowerCase();
    }

    if (this.ignoreWhitespace) {
      origStr = origStr.trim().replace(/\s+/g, ' ');
      modStr = modStr.trim().replace(/\s+/g, ' ');
    }

    if (origStr === modStr) {
      if (this.includeUnchanged) {
        unchanged.push({ path: path || '/', type: 'unchanged' });
      }
    } else {
      changed.push({
        path: path || '/',
        from: original,
        to: modified,
        type: 'changed',
        fromType: 'string',
        toType: 'string'
      });
    }
  }

  private shouldIgnorePath(path: string): boolean {
    for (const ignorePath of this.ignorePaths) {
      if (path === ignorePath || path.startsWith(ignorePath + '.') || path.startsWith(ignorePath + '[')) {
        return true;
      }
    }
    return false;
  }

  private deepEqual(a: JsonValue, b: JsonValue): boolean {
    if (a === b) {
      return true;
    }

    if (a === null || b === null || a === undefined || b === undefined) {
      if (this.treatNullAndUndefinedAsEqual) {
        return (a === null || a === undefined) && (b === null || b === undefined);
      }
      return false;
    }

    const typeA = typeof a;
    const typeB = typeof b;

    if (typeA !== typeB) {
      return false;
    }

    if (typeA === 'number') {
      return a === b;
    }

    if (typeA === 'string') {
      let strA = a as string;
      let strB = b as string;

      if (this.caseInsensitive) {
        strA = strA.toLowerCase();
        strB = strB.toLowerCase();
      }

      if (this.ignoreWhitespace) {
        strA = strA.trim().replace(/\s+/g, ' ');
        strB = strB.trim().replace(/\s+/g, ' ');
      }

      return strA === strB;
    }

    if (typeA === 'boolean') {
      return a === b;
    }

    if (Array.isArray(a) && Array.isArray(b)) {
      if (this.compareArrayOrder && a.length !== b.length) {
        return false;
      }

      if (this.compareArrayOrder) {
        for (let i = 0; i < a.length; i++) {
          if (!this.deepEqual(a[i], b[i])) {
            return false;
          }
        }
        return true;
      }

      // Set comparison
      if (a.length !== b.length) {
        return false;
      }

      const bCopy = [...b];
      for (const item of a) {
        let found = false;
        for (let i = 0; i < bCopy.length; i++) {
          if (this.deepEqual(item, bCopy[i])) {
            bCopy.splice(i, 1);
            found = true;
            break;
          }
        }
        if (!found) {
          return false;
        }
      }
      return true;
    }

    if (typeA === 'object') {
      const keysA = Object.keys(a as JsonObject);
      const keysB = Object.keys(b as JsonObject);

      if (keysA.length !== keysB.length) {
        return false;
      }

      for (const key of keysA) {
        if (!keysB.includes(key)) {
          return false;
        }

        if (!this.deepEqual((a as JsonObject)[key], (b as JsonObject)[key])) {
          return false;
        }
      }

      return true;
    }

    return false;
  }

  private getType(value: JsonValue): string {
    if (value === null) {
      return 'null';
    }
    if (Array.isArray(value)) {
      return 'array';
    }
    return typeof value;
  }
}

export function dataDiff(
  original: JsonValue,
  modified: JsonValue,
  options?: DataDiffOptions
): DataDiffResult {
  const engine = new DataDiffEngine(options);
  return engine.diff(original, modified);
}
