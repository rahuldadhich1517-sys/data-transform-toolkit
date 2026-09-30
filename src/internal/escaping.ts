/**
 * Shared escaping and unescaping utilities
 */

import { SecurityError } from '../errors/index.js';

/** Escape HTML special characters */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Decode common HTML entities */
export function unescapeHtml(html: string): string {
  return html
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&amp;/g, '&');
}

/** Escape XML special characters */
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Unescape XML special characters */
export function unescapeXml(xml: string): string {
  return xml
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/** Validate XML tag name */
export function isValidXmlName(name: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9._:-]*$/.test(name);
}

/** Escape SQL string literal (doubles single quotes) */
export function escapeSqlString(value: string): string {
  return value.replace(/'/g, "''");
}

export type SqlDialect = 'standard' | 'postgres' | 'mysql' | 'sqlite';

/** Safely quote a SQL identifier, rejecting invalid characters */
export function quoteSqlIdentifier(identifier: string, dialect: SqlDialect = 'standard'): string {
  // Disallow null bytes or dangerous chars
  if (/[\0\x08\x09\x1a\n\r]/.test(identifier)) {
    throw new SecurityError('SQL identifier contains invalid control characters', {
      violation: 'SQL_INJECTION',
      context: { identifier }
    });
  }

  // Check if identifier is a simple safe name
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
    return identifier;
  }

  if (dialect === 'mysql') {
    return `\`${identifier.replace(/`/g, '``')}\``;
  }

  // Standard, postgres, sqlite use double quotes
  return `"${identifier.replace(/"/g, '""')}"`;
}

/** Escape key for Java .properties file */
export function escapePropertyKey(key: string): string {
  return key
    .replace(/\\/g, '\\\\')
    .replace(/ /g, '\\ ')
    .replace(/:/g, '\\:')
    .replace(/=/g, '\\=');
}

/** Escape value for Java .properties file */
export function escapePropertyValue(val: string): string {
  return val
    .replace(/\\/g, '\\\\')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t');
}

/** Safely assign property to object preventing prototype pollution */
export function safeSetProperty(target: Record<string, unknown>, key: string, value: unknown): void {
  if (key === '__proto__') {
    Object.defineProperty(target, key, {
      value,
      writable: true,
      enumerable: true,
      configurable: true
    });
  } else {
    target[key] = value;
  }
}

/** Check if key could cause prototype pollution */
export function isDangerousKey(key: string): boolean {
  return key === '__proto__' || key === 'constructor' || key === 'prototype';
}
