import path from 'path';
import archiver from 'archiver'; // For zipping
import bcrypt from 'bcrypt';
import fs from 'fs/promises';
import unzipper from 'unzipper'; // For unzipping
import { createWriteStream, createReadStream } from 'fs';
import { Logger } from "~/server/utils/logger";
import { createStatus } from "~/server/utils/helpers";
import { query } from './database';
import { getCache, setCache, deleteFromCache } from "~/server/utils/cache";
import { verifyJwtToken } from "~/server/utils/auth";


const MAX_SNIPPET_SIZE = process.env.MAX_SNIPPET_SIZE; // 2 MB limit
const SNIPPETS_DIR = process.env.STORAGE_PATH_SNIPPETS;


export interface SnippetData {
    id: number;
    slug: string;
    title: string;
    language: string;
    password: string | null;
    path: string;
    created_at: Date;
    expiration_date: Date;
}

export class SnippetCreator {
    public static PRESET_TEST_PASSWORD: SnippetData = {
        slug: 'preset-test-password',
        password: 'Hello World',
    }
    private data: SnippetData;
    constructor() {
        this.data = {}
    }
    withPreset(preset: SnippetData): SnippetCreator {
        this.data = preset;
        return this;
    }
    withTitle(title: string): SnippetCreator {
        this.data.title = title;
        return this;
    }
    withLanguage(language: string): SnippetCreator {
        this.data.language = language;
        return this;
    }
    withPassword(password: string): SnippetCreator {
        this.data.password = password;
        return this;
    }
    withExpirationDate(expirationDate: Date): SnippetCreator {
        this.data.expiration_date = expirationDate;
        return this;
    }
    withSlug(slug: string): SnippetCreator {
        this.data.slug = slug;
        return this;
    }
    withPath(path: string): SnippetCreator {
        this.data.path = path;
        return this;
    }
    withCreatedAt(createdAt: Date): SnippetCreator {
        this.data.created_at = createdAt;
        return this;
    }
    build(): SnippetData {
        return this.data;
    }
}


export async function saveSnippet(title: string,
                                  code: string,
                                  language: string,
                                  password: string | null,
                                  expirationDate: Date | null): Promise<string> {
    const slug = generateSlug(4);
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
    const zipPath = path.join(SNIPPETS_DIR, `${slug}.zip`); // Save as a .zip file
    const buffer = Buffer.from(code);
    if (buffer.length > MAX_SNIPPET_SIZE) {
        return createStatus(500, 'Snippet exceeds the maximum size of 2 MB');
    }
    try {
        // Check if the directory exists, and create it if it doesn't
        await fs.mkdir(SNIPPETS_DIR, { recursive: true });

        // Create the zip file and add the snippet as a .txt file
        const output = createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        archive.pipe(output);
        archive.append(`${code}`, { name: `${slug}.txt` });

        // Finalize the archive to ensure all data is written to the zip file
        await archive.finalize();

        // Wait until the stream is completely written
        await new Promise((resolve, reject) => {
            output.on('close', resolve);
            output.on('error', reject);
        });

        // Save metadata to the database
        await query(
            `INSERT INTO snippets (slug, title, language, password, path, expiration_date) VALUES (?, ?, ?, ?, ?, ?)`,
            [slug, title, language, hashedPassword, zipPath, expirationDate]
        );

        return slug; // Return the slug so the user can be redirected to the snippet view page
    } catch (error) {
        return createStatus(500, 'Failed to save the snippet: ' + error.message);
    }
}

export async function getSnippetContent(slug: string): Promise<string> {
    const zipPath = (await getSnippetData(slug)).path; // The path to the .zip file
    // Use unzipper to extract the contents of the zip
    const directory = await unzipper.Open.file(zipPath);
    const file = directory.files.find(file => file.path.endsWith('.txt'));
    if (file) {
        // Extract and return the code content from the .txt file
        const content = await file.buffer();
        return content.toString('utf-8');
    }
    return createError(404, 'Snippet file not found in zip');
}

export async function getSnippetData(slug: string): Promise<SnippetData> {
    if (!slug) {
        throw new Error('Snippet data is undefined');
    }

    const cacheKey = `snippet:${slug}:metadata`;
    let metadata: SnippetData = await getCache(cacheKey);

    if (!metadata) {
        const result = await query(`SELECT * FROM snippets WHERE slug = ?`, [slug]);
        if (!result || result.length === 0) {
            throw new Error('Snippet not found');
        }
        metadata = result[0];
        setCache(cacheKey, metadata);
    }
    return metadata;
}

export async function snippetExists(slug: string): Promise<boolean> {
    const result = await query(`SELECT COUNT(*) as count FROM snippets WHERE slug = ?`, [slug]);
    return result[0].count > 0;
}

export async function getSnippetForDownload(slug: string) {
    const zipPath = (await getSnippetData(slug)).path; // The path to the .zip file
    return createReadStream(zipPath); // Stream the zip file
}

export async function deleteSnippet(slug: string): Promise<void> {
    const metadata: SnippetData = await getSnippetData(slug);
    await fs.unlink(metadata.path);
    await query(`DELETE FROM snippets WHERE slug = ?`, [slug]);
    deleteFromCache(`snippet:${slug}:metadata`);
}

export async function validateExpiration(metadata: SnippetData, date: Date): Promise<boolean> {
    if (metadata.expiration_date && metadata.expiration_date < date) {
        await deleteSnippet(metadata.slug);
        return true;
    }
    return false;
}

export async function validateSnippet(event, snippetId: string): Promise<{ statusCode: number, metadata?: SnippetData, statusMessage?: string }> {
    const metadata = await getSnippetData(snippetId);
    const now = new Date();
    Logger.info(`Time: ${now.toISOString()}`);

    if (!metadata) {
        Logger.error(`Snippet not found`);
        return createStatus(404, 'Snippet not found');
    } else {
        Logger.success(`Snippet found`);
    }

    if (await validateExpiration(metadata, now)) {
        Logger.success(`Snippet expired > deleting`);
        return createStatus(402, 'This snippet has already expired');
    } else {
        Logger.success(`Snippet not expired`);
    }
    return { statusCode: 200, metadata };
}

export async function validateAuth(metadata: SnippetData,
                                   authToken: string | undefined,
                                   password: string,
                                   onTokenSuccess: () => Promise<any>,
                                   onPasswordSuccess: () => Promise<any>,
                                   onNoAuthRequired: () => any): Promise<any> {
    // Check if snippet requires authentication
    if (metadata.password) {
        Logger.info(`Snippet requires authentication`);
        // Check if authorization token is provided
        if (authToken !== undefined) {
            Logger.success(`JWT Token provided`);
            try {
                // Decode the JWT token
                const decoded = verifyJwtToken(authToken);
                if (decoded.snippetId === metadata.slug) {
                    Logger.success(`JWT Token validated`);
                    // Run the custom success handler
                    return await onTokenSuccess();
                }
                Logger.error(`Unauthorized: Invalid token`);
                return createStatus(405, 'Unauthorized: Invalid token');
            } catch (error: Error) {

                if (error.message === 'jwt expired') {
                    Logger.error(`JWT Token expired`);
                    return createStatus(406, 'JWT Token expired');
                }
                Logger.error(`Error validating token: ${error.message}`);
                return createStatus(405, `Error validating token: ${error.message}`);
            }
        }
        Logger.error(`No JWT token provided, checking password`);
        // Check if password is provided
        if (!password) {
            Logger.error(`Unauthorized: No password provided`);
            return createStatus(401, 'Unauthorized: Password required');
        }
        Logger.success(`Password provided`);
        // Validate the password
        const isValidPassword = await bcrypt.compare(password, metadata.password);
        if (!isValidPassword) {
            Logger.error(`Unauthorized: Invalid password`);
            return createStatus(403, 'Unauthorized: Invalid password');
        }
        Logger.success(`Password validated`);
        // Run the custom success handler
        return await onPasswordSuccess();
    } else {
        Logger.info(`Snippet does not require password`);
        return await onNoAuthRequired();
    }
}















