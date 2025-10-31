/**
 * Basic test to verify test infrastructure is working
 */
import { describe, it, expect } from 'vitest';

describe('Basic Test Infrastructure', () => {
    it('should run basic tests', () => {
        expect(1 + 1).toBe(2);
    });

    it('should handle async operations', async () => {
        const result = await Promise.resolve('success');
        expect(result).toBe('success');
    });
});
