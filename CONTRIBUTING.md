# Contributing to Data Transform Toolkit

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and constructive in all interactions with other contributors.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Install dependencies: `npm install`
4. Create a feature branch: `git checkout -b feature/your-feature`

## Development Setup

```bash
# Install dependencies
npm install

# Run tests in watch mode
npm test

# Check types
npm run typecheck

# Build the project
npm run build

# Run linter
npm run lint
```

## Making Changes

### Code Style

- Use TypeScript strict mode
- Follow existing code patterns
- Use meaningful variable names
- Add JSDoc comments for public APIs
- Keep functions small and focused

### Testing

- Add tests for new features
- Ensure tests pass: `npm test`
- Maintain 90%+ code coverage
- Test edge cases and error conditions
- Add tests for security issues

### Commit Messages

Use clear, descriptive commit messages:
```
feat: Add CSV streaming support
fix: Handle edge case in XML parser
docs: Update README with examples
test: Add comprehensive CSV tests
```

## Pull Request Process

1. Update your fork with the latest main branch
2. Push your changes to your fork
3. Create a Pull Request with a clear description
4. Link any related issues
5. Ensure CI passes
6. Wait for review and address feedback

### PR Description Template

```markdown
## Description
Brief description of changes

## Related Issues
Closes #issue-number

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe tests added/updated

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No new warnings or errors
- [ ] Backward compatible
```

## Feature Development Guidelines

### Adding a New Converter

1. Create parser in `src/parsers/`
2. Create serializer in `src/serializers/`
3. Create converter in `src/converters/`
4. Add types in `src/types/`
5. Add comprehensive tests
6. Update `src/index.ts` exports
7. Update README documentation

### Adding Error Handling

- Extend `DataTransformError` for new error types
- Include useful context information
- Provide line/column information when applicable
- Keep error messages user-friendly

### Performance Considerations

- Use iterative parsing when possible
- Avoid unnecessary object copying
- Optimize hot code paths
- Document performance limits
- Add benchmarks for critical paths

## Testing Requirements

- **Unit Tests**: Test individual functions
- **Integration Tests**: Test converter chains
- **Round-trip Tests**: Verify data integrity
- **Security Tests**: Test against DOS attacks
- **Error Tests**: Test error handling

### Test Structure

```typescript
describe('Feature Name', () => {
  it('should handle basic case', () => {
    // Arrange
    const input = ...;
    
    // Act
    const result = convert(input);
    
    // Assert
    expect(result).toEqual(...);
  });
});
```

## Documentation

- Update README for new features
- Add JSDoc comments to public APIs
- Document breaking changes
- Include code examples
- Update error documentation

## Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Commit changes
4. Create git tag: `git tag v1.x.x`
5. Push tag: `git push origin v1.x.x`
6. GitHub Actions will publish to npm

## Security Issues

For security vulnerabilities, email security@example.com instead of using the issue tracker.

## Questions?

- Check existing issues for answers
- Read the README and documentation
- Open a discussion issue
- Reach out to maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be recognized in releases and documentation.

Thank you for contributing!
