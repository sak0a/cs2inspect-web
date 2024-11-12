
import fs from 'fs/promises';
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt';
import path from 'path';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { query } from '~/server/utils/database';
import { getCache, setCache, deleteFromCache } from '~/server/utils/cache';
import {
    SnippetCreator,
    saveSnippet,
    getSnippet,
    deleteSnippet, getSnippetData, validateAuth, validateExpiration
} from '~/server/utils/snippets';
import * as snippetUtils from '~/server/utils/snippets';

import {createJwtToken, createJwtTokenWithExpiration} from '~/server/utils/auth';



const GENERATED_PASSWORD = await bcrypt.hash('generated', 10);


vi.mock('~/server/utils/snippets', async () => {
    const originalModule = await vi.importActual('~/server/utils/snippets');
    return {
        ...originalModule,
        getSnippetData: vi.fn().mockResolvedValue({
            slug: '12345',
            expiration_date: new Date(Date.now() - 1000),
        }),
        deleteSnippet: vi.fn().mockResolvedValue(),
    };
});
vi.mock('~/server/utils/db', () => ({
    query: vi.fn(),
}));

vi.mock('~/server/utils/cache', () => ({
    getCache: vi.fn(),
    setCache: vi.fn(),
    deleteFromCache: vi.fn(),
}));

vi.mock('fs/promises', async () => {
    const originalModule = await vi.importActual('fs/promises');
    return {
        ...originalModule,
        writeFile: vi.fn(),
        readFile: vi.fn(),
        unlink: vi.fn().mockImplementation(() => {
            return Promise.resolve();
            }),
        mkdir: vi.fn(),
    };
});
describe('Snippet Utilities', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('saveSnippet', () => {
    });

    describe('getSnippet', () => {
    });

    describe('deleteSnippet', () => {
    });

    describe('validateExpiration', () => {
        it('given a snippet with expiration date and future date provided, should return true', async () => {
            const metadata = {
                slug: '12345',
                expiration_date: new Date(Date.now() - 1000),
            };

            getSnippetData.mockResolvedValue(metadata.slug);
            deleteSnippet.mockResolvedValue();
            const result = await validateExpiration(metadata, Date.now());

            expect(result).toBe(true);
            expect(deleteSnippet).toHaveBeenCalledWith(metadata.slug);
        });

    });

    describe('validateSnippet', () => {
        it('given a snippet with no slug, should throw error', async () => {
            getSnippetData.mockResolvedValue(null);
            const result = await snippetUtils.validateSnippet({}, '12345');
            expect(result.statusCode).toBe(404);
            expect(result.statusMessage).toBe('Snippet not found');
        });
        it('given a snippet with slug, should return metadata', async () => {
            getSnippetData.mockResolvedValue({ slug: '12345' });
            const result = await snippetUtils.validateSnippet({}, '12345');
            expect(result.statusCode).toBe(200);
            expect(result.metadata).toHaveProperty('slug', '12345');
        });
        it('given a snippet with expiration date and future date provided, should return 402', async () => {
            getSnippetData.mockResolvedValue({
                slug: '12345',
                expiration_date: new Date(Date.now() - 1000),
            });
            const result = await snippetUtils.validateSnippet({}, '12345');
            expect(result.statusCode).toBe(402);
            expect(result.statusMessage).toBe('This snippet has already expired');
        });
    });

    describe('cache', () => {
        it('should set and get cache', async () => {
            const key = 'test-key';
            const value = 'test-value';
            setCache.mockResolvedValue();
            getCache.mockResolvedValue(value);
            await setCache(key, value);
            const result = await getCache(key);
            expect(result).toBe(value);
        });
        it('should delete from cache', async () => {
            const key = 'test-key';
            deleteFromCache.mockResolvedValue();
            await deleteFromCache(key);
            expect(deleteFromCache).toHaveBeenCalledWith(key);
        });
    });

    describe('validateAuthorization', () => {
        it('given a snippet with password and valid auth token provided and unexpected error, should return 405', async () => {
            const data = new SnippetCreator()
                .withSlug('12345')
                .withPassword(GENERATED_PASSWORD)
                .build();
            const authToken = await createJwtToken(data.slug);
            const result = await validateAuth(data, authToken, undefined,
                () => { throw new Error('Unexpected error'); },
                () => {}, () => {});
            expect(result.statusCode).toBe(405);
            expect(result.statusMessage).contain('Unexpected error');
        });

        it('given a snippet with password and valid auth token provided and expired, should return 406', async () => {
            const data = new SnippetCreator()
                .withSlug('12345')
                .withPassword(GENERATED_PASSWORD)
                .build();
            const authToken = await createJwtTokenWithExpiration(data.slug, '1ms');
            const result = await validateAuth(data, authToken, undefined,
                () => {},
                () => {}, () => {});
            expect(result.statusCode).toBe(406);
            expect(result.statusMessage).toBe('JWT Token expired');
        });

        it('given a snippet with no password and valid auth token provided, should return true', async () => {
            const data = new SnippetCreator()
                .withSlug('12345')
                .build();
            const authToken = await createJwtToken(data.slug);
            const result = await validateAuth(data, authToken, undefined,
                () => { },
                () => {}, () => { return true; });
            expect(result).toBe(true);
        });

        it('given a snippet with password and valid auth token provided, should return true', async () => {
            const data = new SnippetCreator()
                .withSlug('12345')
                .withPassword(GENERATED_PASSWORD)
                .build();
            const authToken = await createJwtToken(data.slug);
            const result = await validateAuth(data, authToken, undefined,
                () => { return true; },
                () => {}, () => {});
            expect(result).toBe(true);
        });

        it('given a snippet with password and invalid auth token provided, should return 405 ', async () => {
            const data = new SnippetCreator()
                .withSlug('12345')
                .withPassword(GENERATED_PASSWORD)
                .build();
            const authToken = await createJwtToken("wrongSlug");
            const result = await validateAuth(data, authToken, undefined,
                () => {},
                () => {}, () => {});
            expect(result.statusCode).toBe(405);
            expect(result.statusMessage).toBe('Unauthorized: Invalid token');
        });

        it('given a snippet with a password and password provided, should return true ', async () => {
            const data = new SnippetCreator()
                .withSlug('12345')
                .withPassword(GENERATED_PASSWORD)
                .build();
            const result = await validateAuth(data, undefined, "generated",
                () => {},
                () => { return true; },
                () => {}
            );
            expect(result).toBe(true);
        });

        it('given a snippet with a password and no password provided, should return 401', async () => {
            const data = new SnippetCreator()
                .withSlug('12345')
                .withPassword(GENERATED_PASSWORD)
                .build();
            const result = await validateAuth(data, undefined, undefined,
                () => {}, () => {}, () => {});
            expect(result.statusCode).toBe(401);
            expect(result.statusMessage).toBe('Unauthorized: Password required');
        });

        it('given a snippet with no password and no password provided, should return true', async () => {
            const data = new SnippetCreator()
                .withSlug('12345')
                .build();
            const result = await validateAuth(data, undefined, undefined,
                () => {}, () => { }, () => { return true;});
            expect(result).toBe(true);
        });

        it('given a snippet with a password and wrong password provided, should return 403', async () => {
            const data = new SnippetCreator()
                .withSlug('12345')
                .withPassword(GENERATED_PASSWORD)
                .build();
            const result = await validateAuth(data, undefined, "wrong",
                () => {}, () => {}, () => {});
            expect(result.statusCode).toBe(403);
            expect(result.statusMessage).toBe('Unauthorized: Invalid password');
        });
    });
});
