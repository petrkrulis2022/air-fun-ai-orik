# Contributing to air.fun MVP

## Development Setup

1. Follow the instructions in `SETUP.md` to set up your development environment
2. Install recommended VSCode extensions (see `.vscode/extensions.json`)
3. Ensure all tests pass before making changes: `npm test`

## Code Style

This project uses ESLint and Prettier for code formatting and linting.

### Running Linting

```bash
# Check for linting errors
npm run lint

# Format code
npm run format

# Check formatting without making changes
npm run format:check
```

### Pre-commit Checklist

Before committing code, ensure:
- [ ] All linting errors are fixed
- [ ] Code is properly formatted
- [ ] All tests pass
- [ ] New tests are added for new functionality
- [ ] Environment variables are documented in `.env.example`

## Testing Guidelines

### Unit Tests
- Write unit tests for all new functions and services
- Aim for 80%+ code coverage
- Use descriptive test names
- Test edge cases and error conditions

### Property-Based Tests
- Use fast-check library for property-based testing
- Configure tests to run minimum 100 iterations
- Tag tests with property references from design document
- Format: `// Feature: air-fun-mvp, Property X: Description`

### Running Tests

```bash
# Run all tests
npm test

# Run tests for specific package
cd packages/backend
npm test

# Run tests in watch mode (development)
cd packages/backend
npx vitest
```

## Commit Message Format

Use clear, descriptive commit messages:

```
<type>: <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Example:
```
feat: implement bonding curve price calculation

- Add calculatePrice function using quadratic formula
- Add getPriceQuote with slippage calculation
- Add unit tests for price calculations

Validates: Requirements 8.1, 8.2, 8.3
```

## Branch Naming

Use descriptive branch names:
- `feature/authentication-service`
- `fix/bonding-curve-calculation`
- `test/property-based-tests`
- `docs/api-documentation`

## Pull Request Process

1. Create a feature branch from `main`
2. Implement your changes
3. Write/update tests
4. Update documentation if needed
5. Run linting and tests
6. Create a pull request with clear description
7. Reference related task numbers from `tasks.md`

## Code Review Guidelines

When reviewing code:
- Check for adherence to requirements
- Verify test coverage
- Look for potential security issues
- Ensure code is readable and maintainable
- Verify error handling is appropriate

## Architecture Decisions

Before making significant architectural changes:
1. Review the design document (`.kiro/specs/air-fun-mvp/design.md`)
2. Discuss with the team
3. Update documentation to reflect changes
4. Ensure changes align with requirements

## Smart Contract Development

Special considerations for smart contracts:
- Aim for 100% test coverage
- Use OpenZeppelin libraries when possible
- Add reentrancy guards to state-changing functions
- Test on testnets before mainnet deployment
- Document gas optimization decisions
- Run security analysis tools (Slither)

## Property-Based Testing

When writing property-based tests:
1. Identify universal properties from design document
2. Write generators that produce valid inputs
3. Configure minimum 100 iterations
4. Tag with property reference
5. Document any assumptions or constraints

Example:
```typescript
// Feature: air-fun-mvp, Property 1: Bonding Curve Price Monotonicity
test("price increases monotonically with supply", () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 1000000 }),
      fc.integer({ min: 1, max: 1000 }),
      (currentSupply, additionalTokens) => {
        const price1 = calculatePrice(currentSupply);
        const price2 = calculatePrice(currentSupply + additionalTokens);
        return price2 >= price1;
      }
    ),
    { numRuns: 100 }
  );
});
```

## Questions?

If you have questions about contributing:
1. Check the design document
2. Review existing code for patterns
3. Ask in team discussions
4. Refer to the architecture documentation

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
