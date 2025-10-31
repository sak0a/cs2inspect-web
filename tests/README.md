# Server Test Suite

This directory contains comprehensive tests for the CS2 Inspect Web server-side functionality, with a focus on authentication, authorization, and API endpoint protection.

## Overview

The test suite validates:
- **Authentication Protection Logic**: Verifies protected path detection and JWT token validation
- **Authorization Logic**: Tests user-specific access controls
- **JWT Token Handling**: Tests token generation, validation, expiration, and signature verification
- **Cookie Parsing**: Validates cookie extraction logic
- **Edge Cases**: Tests boundary conditions and error scenarios

## Test Structure

```
tests/
├── README.md                           # This file
└── server/
    ├── utils/
    │   └── test-helpers.ts            # JWT token generation and test utilities
    ├── unit/
    │   └── auth-middleware-unit.test.ts  # Unit tests for auth middleware logic
    └── basic.test.ts                  # Basic infrastructure validation
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test tests/server/unit/auth-middleware-unit.test.ts

# Run tests with NODE_ENV=test (recommended)
NODE_ENV=test npm test
```

## Test Categories

### 1. Authentication Middleware Unit Tests (`auth-middleware-unit.test.ts`)

Comprehensive unit tests for authentication middleware logic:

#### Protected Path Detection
- Verifies that protected paths are properly defined in constants
- Tests expected protected paths including `/api/weapons`, `/api/loadouts`, `/api/knives`, etc.
- Validates `startsWith` logic for path matching
- Ensures paths that don't start with protected paths are not matched (e.g., `/api/data/weapons`)

#### JWT Token Generation and Validation
- Tests valid JWT token generation with proper structure (3 parts)
- Verifies token validation with correct payload
- Tests rejection of expired tokens
- Tests rejection of tokens with invalid signatures
- Tests rejection of malformed tokens

#### Token Payload Structure
- Validates `steamId` inclusion in token payload
- Validates `type` field in token payload
- Checks standard JWT claims (`iat`, `exp`)

#### Authorization Logic
- Tests access control when token steamId matches requested steamId
- Tests denial when token steamId doesn't match requested steamId

#### Cookie Parsing
- Tests auth_token extraction from cookie strings
- Tests handling of multiple cookies
- Tests behavior when auth_token is missing

#### Edge Cases
- Tests empty path handling
- Tests undefined path handling
- Tests case sensitivity in path matching

### 2. Basic Infrastructure Tests (`basic.test.ts`)

Simple tests to verify the test infrastructure is working:
- Basic arithmetic operations
- Async operation handling

## Test Utilities

### `test-helpers.ts`

Provides utility functions for testing:

```typescript
// Generate valid JWT token
const token = generateValidToken('76561198000000001');

// Generate expired token
const expiredToken = generateExpiredToken();

// Generate token with invalid signature
const invalidToken = generateInvalidSignatureToken();

// Create cookie header
const cookie = createAuthCookie(token);

// Test user constants
TEST_USERS.VALID_USER    // steamId: '76561198000000001'
TEST_USERS.ANOTHER_USER  // steamId: '76561198000000002'
```

## Authentication Flow

1. **JWT Secret**: Uses `process.env.JWT_TOKEN` or defaults to `'your-secret-key'`
2. **Cookie Name**: `auth_token` (HTTP-only, secure, SameSite=lax)
3. **Token Payload**: 
   ```json
   {
     "steamId": "76561198000000001",
     "type": "steam_auth"
   }
   ```
4. **Token Expiration**: Default 7 days

## Protected API Paths

As defined in `/server/utils/constants.ts`:

```typescript
export const PROTECTED_API_PATHS = [
    '/api/weapons',
    '/api/loadouts',
    '/api/knives',
    '/api/knives/save',
    '/api/weapons/save',
    '/api/weapons/inspect',
    '/api/weapons/[type]',
    '/api/auth/'
];
```

## Environment Variables

The tests use environment variables that match the production configuration:

- `JWT_TOKEN`: Secret key for JWT signing (defaults to 'your-secret-key' in tests)
- `JWT_EXPIRY`: Token expiration time (default: '7d')

## Test Configuration

Tests use:
- **Framework**: Vitest
- **Test Utils**: @nuxt/test-utils (provides `setup`, `$fetch`)
- **Environment**: happy-dom (configured in `vitest.config.ts`)
- **Server Mode**: Tests run with actual Nuxt server

## Writing New Tests

When adding new protected endpoints:

1. Add the path to `PROTECTED_API_PATHS` in `/server/utils/constants.ts`
2. Add test case to verify it's in the array:
   ```typescript
   it('should include /api/new-endpoint in protected paths', () => {
       expect(PROTECTED_API_PATHS).toContain('/api/new-endpoint');
   });
   ```
3. Test the path matching logic:
   ```typescript
   it('should detect /api/new-endpoint as protected', () => {
       const isProtected = PROTECTED_API_PATHS.some(route => 
           '/api/new-endpoint'.startsWith(route)
       );
       expect(isProtected).toBe(true);
   });
   ```

When adding new authentication logic:

1. Create unit tests that verify the logic without requiring server
2. Test both success and failure scenarios
3. Test edge cases and boundary conditions
4. Use the helper functions in `test-helpers.ts` for JWT token generation

## Test Coverage

Current test coverage includes:

- ✅ Protected path detection logic
- ✅ JWT token generation, validation, and verification
- ✅ Token expiration handling
- ✅ Invalid signature detection
- ✅ Malformed token handling
- ✅ Authorization logic (steamId matching)
- ✅ Cookie parsing and extraction
- ✅ Edge case handling (empty paths, undefined values, case sensitivity)
- ✅ Test infrastructure validation

## Troubleshooting

### Tests failing with "Cannot find module"
```bash
npm install
npm run postinstall  # Run nuxt prepare
```

### Tests timing out or hanging
- Make sure to run tests with `NODE_ENV=test`
- Check that the Nuxt close hook is not interfering (should skip on test env)

### Authentication tests failing
- Verify `JWT_TOKEN` environment variable in `.env`
- Default test secret is `'your-secret-key'`
- Tests use `process.env.JWT_TOKEN || 'your-secret-key'`

### Import errors
- Ensure all TypeScript types are generated: `npm run postinstall`
- Check that paths in imports are correct relative to test location

## Best Practices

1. **Unit Tests First**: Focus on unit tests that don't require full server setup
2. **Test Business Logic**: Test the core logic of authentication and authorization
3. **Descriptive Test Names**: Use clear, action-oriented test descriptions
4. **Independent Tests**: Each test should be self-contained and not depend on others
5. **Use Constants**: Test against actual constants from the codebase (e.g., `PROTECTED_API_PATHS`)
6. **Error Assertions**: Always verify expected behavior, including error cases

## Integration and E2E Tests

For full integration/E2E tests that require a running server with database:

1. **Setup Requirements**:
   - Running MariaDB database
   - Valid database credentials in `.env`
   - Steam API key (for some endpoints)
   - All external services available

2. **E2E Test Approach**:
   - Use `@nuxt/test-utils` with `setup({ server: true })`
   - Use `$fetch` to make requests to the running server
   - These tests are more comprehensive but require more setup
   - Not included in this test suite due to infrastructure requirements

3. **When to Use E2E Tests**:
   - Testing actual HTTP requests and responses
   - Validating database interactions
   - Testing middleware chains
   - Testing end-to-end user flows

## Future Enhancements

Potential additions to the test suite:

- [ ] Integration tests with mock database
- [ ] E2E tests for full request/response cycles (requires database setup)
- [ ] Rate limiting tests (when implemented)
- [ ] CSRF protection tests (if implemented)
- [ ] Session management tests
- [ ] Token refresh tests (if implemented)
- [ ] Role-based access control tests (if roles are added)
- [ ] Performance/load tests
- [ ] Security vulnerability tests
- [ ] Snapshot tests for API responses

## Related Documentation

- [Nuxt Test Utils](https://nuxt.com/docs/getting-started/testing)
- [Vitest Documentation](https://vitest.dev/)
- [JWT Documentation](https://jwt.io/)
