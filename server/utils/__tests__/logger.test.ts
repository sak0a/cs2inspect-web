import { describe, it, expect } from 'bun:test';
import { Logger } from '../logger';

describe('Logger', () => {
    // We only test that these don't throw during execution
    // Since they mostly log to console in non-production environments

    it('info should execute without throwing', () => {
        expect(() => Logger.info('test message')).not.toThrow();
        expect(() => Logger.info('test message', 'context')).not.toThrow();
    });

    it('error should execute without throwing', () => {
        expect(() => Logger.error('test error')).not.toThrow();
        expect(() => Logger.error('test error', 'context')).not.toThrow();
    });

    it('warn should execute without throwing', () => {
        expect(() => Logger.warn('test warn')).not.toThrow();
        expect(() => Logger.warn('test warn', 'context')).not.toThrow();
    });

    it('debug should execute without throwing', () => {
        expect(() => Logger.debug('test debug')).not.toThrow();
        expect(() => Logger.debug('test debug', 'context')).not.toThrow();
    });

    it('success should execute without throwing', () => {
        expect(() => Logger.success('test success')).not.toThrow();
        expect(() => Logger.success('test success', 'context')).not.toThrow();
    });

    it('header should execute without throwing', () => {
        expect(() => Logger.header('test header')).not.toThrow();
    });

    it('responseTime should execute without throwing', () => {
        expect(() => Logger.responseTime(Date.now() - 100)).not.toThrow();
    });
});
