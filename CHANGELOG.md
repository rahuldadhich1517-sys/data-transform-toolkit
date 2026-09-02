# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-15

### Added

#### Core Features
- **JSON ↔ CSV Converter** - Complete implementation with state machine-based parser
  - RFC 4180 CSV standard compliance
  - Custom delimiter support
  - Proper escaping and quoting
  - Multiline field support
  - CRLF and LF line ending support
  
- **JSON ↔ YAML Converter** - Full YAML serialization and parsing
  - Proper indentation handling
  - Support for nested objects and arrays
  - Automatic quoting of special values
  - Comment parsing
  - YAML 1.1 subset compliance
  
- **JSON ↔ XML Converter** - Complete XML implementation
  - XML declaration support
  - Proper XML entity escaping
  - Attribute handling with configurable prefix
  - CDATA section support
  - Comment parsing
  - Safe parsing (no entity expansion attacks)
  
- **Data Diff Engine** - Comprehensive comparison tool
  - Deep nested object comparison
  - Array comparison with order control
  - Added/removed/changed property tracking
  - Type change detection
  - Configurable comparison options
  - Path-based change tracking

#### Developer Experience
- Strict TypeScript with full type safety
- Comprehensive error classes with detailed information
- Clean and intuitive API
- No input mutation (immutable operations)
- Deterministic output
- Full JSDoc documentation

#### Quality & Security
- 90%+ test coverage
- Security protections against DOS attacks
- Input validation with depth/length limits
- Secure parsing (no code execution)
- No runtime dependencies
- Production-ready error handling

#### Documentation
- Comprehensive README with examples
- API reference for all converters
- Security documentation
- Performance notes
- Error handling guide
- Supported formats documentation

#### Testing
- Unit tests for all converters
- Round-trip conversion tests
- Security tests (DOS protection)
- Error handling tests
- Edge case coverage

#### Build & CI/CD
- TypeScript strict mode configuration
- Vitest testing framework setup
- GitHub Actions CI workflow
- npm publishing workflow
- Build configuration

### Initial Release

- Complete implementation of all planned features
- Production-ready quality
- Full documentation
- Comprehensive test coverage
- Ready for npm publication

---

## Version History Format

### [Version] - YYYY-MM-DD

#### Added
- New features

#### Changed
- Modified existing features

#### Fixed
- Bug fixes

#### Removed
- Removed features

#### Deprecated
- Deprecated features

#### Security
- Security updates

