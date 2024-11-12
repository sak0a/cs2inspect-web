import bcrypt from 'bcrypt';
import fs from 'fs/promises';
import path from 'path';
import { createWriteStream, createReadStream } from 'fs';
import { query } from './database'; // MariaDB connection
import { deleteFromCache, getCache, setCache } from "~/server/utils/cache";

const FILES_DIR = './storage/files';

export interface FileData {
    id: number;
    slug: string;
    filenames: string;
    password: string | null;
    path: string;
    created_at: Date;
    expiration_date: Date;
}

export async function saveFiles(files: Buffer[], filenames: string[], password: string | null): Promise<string> {
    try {
        const slug: string = generateSlug(4);
        const hashedPassword: string = password ? await bcrypt.hash(password, 10) : null;
        const zipPath: string = path.join(FILES_DIR, `${slug}.zip`);

        // Create the zip file and add the files
        const output = createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        archive.pipe(output);
        files.forEach((file: Buffer, index: number) => {
            archive.append(file, { name: filenames[index] });
        });

        // Finalize the archive to ensure all data is written to the zip file
        await archive.finalize();

        // Wait until the stream is completely written
        await new Promise((resolve, reject) => {
            output.on('close', resolve);
            output.on('error', reject);
        });

        // Save metadata to the database
        await query(
            `INSERT INTO files (slug, filenames, password, path) VALUES (?, ?, ?, ?)`,
            [slug, filenames.join(', '), hashedPassword, zipPath]
        );

        return slug;
    } catch (error: Error) {
        return createStatus(500, 'Internal server error: ' + error.message);
    }
}

export async function getFileData(slug: string): Promise<FileData> {
    if (!slug) {
        throw new Error('File data is undefined');
    }

    const cacheKey: string = `file:${slug}:metadata`;
    let metadata: FileData = await getCache(cacheKey);

    if (!metadata) {
        const result = await query(`SELECT * FROM files WHERE slug = ?`, [slug]);
        metadata = result.length > 0 ? result[0] : null;
        if (metadata) {
            setCache(cacheKey, metadata);
        }
    }
    return metadata;
}

export async function getFileForDownload(slug: string) {
    const metadata: FileData = await getFileData(slug);
    return createReadStream(metadata.path); // Stream the zip file
}

// Delete file and metadata
export async function deleteFile(slug: string): Promise<void> {
    const metadata: FileData = await getFileData(slug);
    await fs.unlink(metadata.path);
    await query(`DELETE FROM files WHERE slug = ?`, [slug]);
    deleteFromCache(`file:${slug}:metadata`);
}

export async function validateExpiration(metadata: FileData, date: Date): Promise<boolean> {
    if (metadata.expiration_date && metadata.expiration_date < date) {
        await deleteFile(metadata.slug);
        return true;
    }
    return false;
}

export async function validateFile(event, slug: string): Promise<{ statusCode: number, metadata?: FileData, statusMessage?: string }> {
    const metadata: FileData = await getFileData(slug);
    const now: Date = new Date();
    Logger.info(`Time: ${now.toISOString()}`);

    if (!metadata) {
        Logger.error(`File not found`);
        return createStatus(404, 'File not found');
    } else {
        Logger.success(`File found`);
    }

    if (await validateExpiration(metadata, now)) {
        Logger.success(`File expired > deleting`);
        return createStatus(402, 'This file has already expired');
    } else {
        Logger.success(`File not expired`);
    }
    return { statusCode: 200, metadata };
}

export async function validateAuth(
    metadata: FileData,
    authToken: string | undefined,
    password: string,
    onTokenSuccess: () => Promise<any>,
    onPasswordSuccess: () => Promise<any>,
    onNoAuthRequired: () => any
): Promise<any> {
    // Check if snippet requires authentication
    if (metadata.password) {
        Logger.info(`File requires authentication`);
        // Check if authorization token is provided
        if (authToken !== undefined) {
            Logger.success(`JWT Token provided`);
            try {
                // Decode the JWT token
                const decoded = verifyJwtToken(authToken);
                if (decoded.fileSlug === metadata.slug) {
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
        Logger.info(`File does not require password`);
        return await onNoAuthRequired();
    }
}