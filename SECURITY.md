# Security Policy

## Supported Versions

| Version | Supported          | End of Life |
|---------|-------------------|-------------|
| 1.x     | ✅ Yes             | TBD         |

## Security Guarantees

This package is designed with security in mind:

### Input Validation
- ✅ All inputs are validated before processing
- ✅ Maximum depth limits prevent stack overflow (default: 100 levels)
- ✅ Maximum field/string length limits prevent memory exhaustion
- ✅ Invalid data produces clear error messages

### Attack Prevention
- ✅ **XML Entity Expansion**: No external entity resolution enabled
- ✅ **Billion Laughs**: Depth limits prevent exponential expansion
- ✅ **DOS Protection**: Configurable limits on parsing complexity
- ✅ **Stack Overflow**: Iterative parsing prevents deep recursion
- ✅ **Code Injection**: No `eval()` or `new Function()` usage

### Data Integrity
- ✅ **Immutability**: Input data is never mutated
- ✅ **Output Validation**: Output is always valid for the target format
- ✅ **Encoding**: Proper handling of special characters and escaping
- ✅ **Type Safety**: Strict TypeScript prevents type-related vulnerabilities

## Configurable Security Options

Each converter supports security-related options:

### CSV Parser
```typescript
csvToJson(data, {
  maxDepth: 100,           // Nesting depth limit
  maxFieldLength: 1048576  // Field length limit
});
```

### XML Parser
```typescript
xmlToJson(data, {
  maxDepth: 100,
  maxStringLength: 1048576,
  maxAttributes: 1000      // Prevent attribute DOS
});
```

### YAML Parser
```typescript
yamlToJson(data, {
  maxDepth: 100,
  maxStringLength: 1048576
});
```

### Data Diff
```typescript
dataDiff(original, modified, {
  maxDepth: 100  // Prevent deep recursion DOS
});
```

## Known Limitations

### XML
- No support for external DTD or external entities (by design)
- Limited namespace support (basic element/attribute names only)
- No schema validation (XSD)

### YAML
- YAML 1.1 subset only (not full 1.2 compliance)
- No anchors/aliases
- No custom tags

### CSV
- No streaming for very large files
- State machine assumes ASCII/UTF-8

## Reporting Security Issues

**Do not** open public GitHub issues for security vulnerabilities.

Instead, email: security@example.com

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if available)

Response timeline:
- Acknowledgment within 48 hours
- Investigation within 1 week
- Patch release within 2 weeks for critical issues

## Security Best Practices

### When Using This Package

1. **Validate Configuration**
   ```typescript
   // Good: Set reasonable limits
   const options = {
     maxDepth: 50,
     maxFieldLength: 10000
   };
   ```

2. **Handle Errors**
   ```typescript
   import { CsvParseError } from 'data-transform-toolkit';
   
   try {
     const data = csvToJson(untrustedInput);
   } catch (error) {
     if (error instanceof CsvParseError) {
       // Handle parse error safely
       logger.warn('Invalid CSV', error);
     }
   }
   ```

3. **Input Sanitization**
   ```typescript
   // Check size before processing
   if (input.length > MAX_SIZE) {
     throw new Error('Input too large');
   }
   ```

4. **Trust Boundaries**
   - Only trust verified data sources
   - Validate output before using
   - Log suspicious patterns
   - Monitor resource usage

### In Your Application

1. **Timeouts**: Set execution timeouts for long operations
2. **Rate Limiting**: Limit conversion requests per user/time
3. **Monitoring**: Track parsing errors and anomalies
4. **Logging**: Log all conversion operations
5. **Access Control**: Restrict who can convert data

## Dependency Security

This package has **zero runtime dependencies**, ensuring:
- No supply chain attacks
- No transitive dependency vulnerabilities
- Simplified security audits
- Full control over code quality

Development dependencies are minimized and reviewed carefully.

## Version Updates

Stay updated to get security patches:

```bash
# Check for updates
npm outdated

# Update package
npm update data-transform-toolkit

# Audit dependencies
npm audit
```

## Testing for Security

The package includes security tests:

```bash
# Run all tests including security tests
npm test

# Run security tests specifically
npm test -- --grep "security|DOS|malicious"
```

## Compliance

This package aims to follow:
- OWASP Top 10 security guidelines
- CWE recommendations
- Node.js security best practices
- TypeScript security guidelines

## Security Changelog

All security patches are documented in [CHANGELOG.md](./CHANGELOG.md) with a [Security] prefix.

## Questions?

For security-related questions (non-vulnerability):
- Check this document
- Review the README
- Open a discussion (not an issue)
- Email security-questions@example.com

---

**Last Updated**: 2024-01-15
