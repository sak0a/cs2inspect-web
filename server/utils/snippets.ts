import { createWriteStream, createReadStream } from 'fs';
import path from 'path';
import archiver from 'archiver'; // For zipping
import bcrypt from 'bcrypt';
import fs from 'fs/promises';
import unzipper from 'unzipper'; // For unzipping
import { query } from './db';
import {getCache, setCache, deleteFromCache} from "~/server/utils/cache";
const MAX_SNIPPET_SIZE = 2 * 1024 * 1024; // 2 MB limit
const SNIPPETS_DIR = './storage/snippets';

/**
 * Save a code snippet to the file system and database
 * @param title The title of the snippet
 * @param code The code content of the snippet
 * @param language The programming language of the snippet
 * @param password Optional password to protect the snippet
 * @param expirationDate The expiration date of the snippet
 * @returns The slug of the saved snippet
 */
export async function saveSnippet(title: string, code: string, language: string, password: string | null, expirationDate: Date): Promise<string> {
    const slug: string = generateSlug(4);
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
    const zipPath: string = path.join(SNIPPETS_DIR, `${slug}.zip`); // Save as a .zip file
    const buffer: Buffer = Buffer.from(code);
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

/**
 * Get the code content of a snippet
 * @param slug
 * @returns The code content of the snippet
 */
export async function getSnippetContent(slug: string): Promise<string> {
    const zipPath = await getSnippetPath(slug); // The path to the .zip file
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

/**
 * Get the metadata of a snippet
 * @param slug The slug of the snippet
 * @returns The metadata of the snippet
 */
export async function getSnippetData(slug: string): Promise<SnippetData> {
    const cacheKey = `snippet:${slug}:metadata`;
    let metadata: SnippetData = await getCache(cacheKey);

    if (!metadata) {
        const result = await query(`SELECT * FROM snippets WHERE slug = ?`, [slug]);
        metadata = result.length > 0 ? result[0] : null;
        if (metadata) {
            setCache(cacheKey, metadata);
        }
    }
    return metadata;
}

/**
 * Check if a snippet with the given slug exists
 * @param slug The slug of the snippet
 */
export async function snippetExists(slug: string): Promise<boolean> {
    const result = await query(`SELECT COUNT(*) as count FROM snippets WHERE slug = ?`, [slug]);
    return result[0].count > 0;
}

/**
 * Get the path to the snippet zip file
 * @param slug The slug of the snippet
 * @returns The path to the snippet zip file
 */
export async function getSnippetPath(slug: string): Promise<string> {
    const metadata = await getSnippetData(slug);
    let path: string = metadata ? metadata.path : null;
    if (!metadata) {
        const result = await query(`SELECT path FROM snippets WHERE slug = ?`, [slug]);
        path = result[0].path;
    }
    return path;
}
/**
 * Get the expiration date of a snippet
 * @param slug The slug of the snippet
 */
export async function getSnippetForDownload(slug: string) {
    const zipPath = await getSnippetPath(slug); // The path to the .zip file
    return createReadStream(zipPath); // Stream the zip file
}

/**
 * Delete a snippet from the file system and database
 * @param slug The slug of the snippet to delete
 */
export async function deleteSnippet(slug: string): Promise<void> {
    const path: string = await getSnippetPath(slug);
    await fs.unlink(path);
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

export async function validateAuth(metadata: SnippetData, authToken: string | undefined, password: string, onTokenSuccess: () => Promise<any>, onPasswordSuccess: () => Promise<any>, onNoAuthRequired: () => any): Promise<any> {
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
            } catch (error) {
                if (error.message === 'jwt expired') {
                    Logger.error(`JWT Token has expired`);
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















