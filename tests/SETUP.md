# Test Setup Guide

This guide explains how to set up and run the server test suite for cs2inspect-web.

## Prerequisites

- Node.js >= 20
- npm or compatible package manager
- Git

## Quick Start

```bash
# 1. Clone the repository (if not already done)
git clone https://github.com/sak0a/cs2inspect-web.git
cd cs2inspect-web

# 2. Install dependencies
npm install

# 3. Run Nuxt prepare (generates types)
npm run postinstall

# 4. Run the tests
NODE_ENV=test npm test

# Or run with coverage
NODE_ENV=test npm run test:coverage
```

## Environment Variables

The tests use environment variables for configuration. Create a `.env` file in the project root (it's in `.gitignore`):

```bash
# .env file for testing
PORT=3000
HOST=127.0.0.1
JWT_TOKEN=test-secret-key-for-testing-purposes
JWT_EXPIRY=7d

# Database settings (not required for unit tests)
DATABASE_HOST=127.0.0.1
DATABASE_PORT=3306
DATABASE_USER=testuser
DATABASE_PASSWORD=testpass
DATABASE_NAME=testdb
DATABASE_CONNECTION_LIMIT=5

# Steam API (not required for unit tests)
STEAM_API_KEY=test-steam-api-key

# Logging
LOG_API_REQUESTS=false
```

**Note**: Unit tests don't require a database or Steam API. These values are just placeholders.

## Running Tests

### Run All Tests
```bash
NODE_ENV=test npm test
```

### Run Specific Test File
```bash
NODE_ENV=test npm test tests/server/unit/auth-middleware-unit.test.ts
```

### Run Tests in Watch Mode
```bash
NODE_ENV=test npm run test:watch
```

### Run Tests with Coverage
```bash
NODE_ENV=test npm run test:coverage
```

### Run Tests with Verbose Output
```bash
NODE_ENV=test npx vitest run --reporter=verbose
```

## Test Structure

```
tests/
├── SETUP.md                              # This file
├── README.md                             # Detailed test documentation
└── server/
    ├── utils/
    │   └── test-helpers.ts               # JWT token generation utilities
    ├── unit/
    │   └── auth-middleware-unit.test.ts  # Auth middleware unit tests
    └── basic.test.ts                     # Basic infrastructure validation
```

## What Gets Tested

### Unit Tests
- **Protected Path Detection**: Verifies PROTECTED_API_PATHS constant
- **JWT Token Handling**: Generation, validation, expiration, signatures
- **Authorization Logic**: SteamId matching and access control
- **Cookie Parsing**: Auth token extraction from cookies
- **Edge Cases**: Empty paths, undefined values, case sensitivity

### Not Tested (Requires Infrastructure)
- Full HTTP request/response cycles (requires running server)
- Database operations (requires MariaDB)
- External API calls (requires Steam API)
- End-to-end user flows (requires full application stack)

## Continuous Integration

To run tests in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: |
    npm ci
    npm run postinstall
    NODE_ENV=test npm test
  env:
    JWT_TOKEN: ${{ secrets.JWT_TOKEN_TEST }}
```

## Troubleshooting

### "Cannot find module" Errors

**Problem**: Import errors or missing modules

**Solution**:
```bash
npm install
npm run postinstall  # Regenerate types
```

### Tests Hanging or Timing Out

**Problem**: Tests don't complete

**Solution**:
- Ensure you're running with `NODE_ENV=test`
- Check that `nuxt.config.ts` close hook skips in test env
- Verify vitest config is using 'nuxt' environment

### "Nuxt instance is unavailable"

**Problem**: Nuxt build errors

**Solution**:
```bash
rm -rf .nuxt
npm run postinstall
NODE_ENV=test npm test
```

### JWT Secret Mismatch

**Problem**: Token validation fails

**Solution**:
- Check `.env` file has `JWT_TOKEN` set
- Verify test helpers use same secret: `process.env.JWT_TOKEN || 'your-secret-key'`
- Default test secret is `'your-secret-key'`

### TypeScript Errors

**Problem**: Type checking failures

**Solution**:
```bash
npm run postinstall  # Regenerate .nuxt types
```

## Adding New Tests

### 1. Create a New Test File

```typescript
// tests/server/unit/my-new-test.test.ts
import { describe, it, expect } from 'vitest';

describe('My New Feature', () => {
    it('should work correctly', () => {
        expect(true).toBe(true);
    });
});
```

### 2. Run Your New Test

```bash
NODE_ENV=test npm test tests/server/unit/my-new-test.test.ts
```

### 3. Follow Best Practices

- Keep tests focused and independent
- Use descriptive test names
- Test both success and failure cases
- Use test helpers for common operations
- Don't require external services in unit tests

## IDE Integration

### VS Code

Install the [Vitest extension](https://marketplace.visualstudio.com/items?itemName=vitest.explorer):

```bash
code --install-extension vitest.explorer
```

### WebStorm/IntelliJ

Vitest is supported natively. Configure run configurations with `NODE_ENV=test`.

## Performance

Current test performance:
- **Unit Tests**: ~20 tests in ~16 seconds
- **Cold Start**: ~12s for first run (includes setup)
- **Warm Start**: <1s for subsequent runs in watch mode

## Security Considerations

- Never commit `.env` files (already in `.gitignore`)
- Use different secrets for testing vs production
- Test secrets should be clearly marked as non-production
- Don't use real user data in tests
- Don't use production API keys in tests

## Next Steps

After running tests successfully:

1. **Review Coverage**: Check test coverage report
2. **Add More Tests**: Expand test suite as needed
3. **Setup CI/CD**: Integrate tests into deployment pipeline
4. **Monitor Tests**: Keep tests passing as code evolves
5. **Refactor**: Improve test quality and maintainability

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Nuxt Test Utils](https://nuxt.com/docs/getting-started/testing)
- [JWT Documentation](https://jwt.io/)
- [Project README](../README.md)
- [Test Suite README](./README.md)

## Support

If you encounter issues:

1. Check this guide first
2. Review the [Test Suite README](./README.md)
3. Check existing GitHub issues
4. Create a new issue with:
   - Node version
   - npm version
   - Error message
   - Steps to reproduce
