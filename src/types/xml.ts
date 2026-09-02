/**
 * XML-specific types and options
 */

export interface XmlOptions {
  /** Number of spaces for indentation (default: 2) */
  indentSize?: number;

  /** Maximum nesting depth (default: 100) */
  maxDepth?: number;

  /** Root element name when serializing plain objects (default: "root") */
  rootElement?: string;

  /** Prefix for attributes in output (default: "@") */
  attributePrefix?: string;

  /** Prefix for text content (default: "#text") */
  textContentKey?: string;

  /** Line ending to use (default: "\n") */
  lineEnding?: string;

  /** Include XML declaration (default: true) */
  xmlDeclaration?: boolean;

  /** Maximum string length (default: 1048576) */
  maxStringLength?: number;

  /** Maximum number of attributes per element (default: 1000) */
  maxAttributes?: number;
}

export interface XmlSerializeOptions extends XmlOptions {
  /** Use self-closing tags for empty elements (default: true) */
  selfClosing?: boolean;

  /** XML version in declaration (default: "1.0") */
  xmlVersion?: string;

  /** Encoding in declaration (default: "UTF-8") */
  encoding?: string;
}

export interface XmlParseOptions extends XmlOptions {
  /** Strict parsing mode (default: false) */
  strict?: boolean;

  /** Parse CDATA sections (default: true) */
  parseCdata?: boolean;

  /** Parse comments (default: true) */
  parseComments?: boolean;

  /** Parse numeric strings as numbers (default: true) */
  parseNumbers?: boolean;
}

/** Represents an XML element */
export interface XmlElement {
  name: string;
  attributes: Record<string, string>;
  children: XmlNode[];
  text?: string;
}

/** Represents a node in XML */
export type XmlNode = XmlElement | string | XmlComment | XmlCdata;

/** Represents an XML comment */
export interface XmlComment {
  type: 'comment';
  content: string;
}

/** Represents CDATA section */
export interface XmlCdata {
  type: 'cdata';
  content: string;
}

/** Represents parsed XML structure */
export type XmlValue = XmlElement | string;
