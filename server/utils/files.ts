import { createWriteStream, createReadStream } from 'fs';
import path from 'path';
import { query } from './db'; // MariaDB connection
import bcrypt from 'bcrypt';
import fs from 'fs/promises';

const CHUNK_SIZE = 8 * 1024 * 1024; // 8 MB
const JWT_SECRET = 'rfj!YME0yrz5tud9euv';
const FILES_DIR = './storage/files';


export async function validateFileAccess(fileId: string, password: string | undefined) {
// Retrieve file metadata (including hashed password)
    const metadata = await getFileMetadata(fileId);

    if (!metadata) {
        // Throw a 404 error if the file is not found
        return createError(404, 'File not found');
    }

    // If a password is required, validate it
    if (metadata.password) {
        if (!password) {
            // If password is required but not provided, throw a 401 error
            return createError(401, 'Password required');
        }

        const isValidPassword = await bcrypt.compare(password, metadata.password);
        if (!isValidPassword) {
            // Throw a 401 error if the password is invalid
            return createError(401, 'Invalid password');
        }
    }

    // If validation is successful, return the metadata
    return metadata;
}

export async function getFileMetadata(slug: string) {
    const result = await query(`SELECT * FROM files WHERE slug = ?`, [slug]);
    if (result.length === 0) {
        return createError(401, 'File not found');
    }
    return result[0];
}

// Save a file and split it into chunks if it exceeds 8MB
export async function saveFile(file: Buffer, filename: string, password: string | null): Promise<string> {
    const slug = generateSlug();
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    const chunkPaths = [];
    let chunkIndex = 0;

    // Split the file into chunks if it's larger than the CHUNK_SIZE (8MB)
    for (let offset = 0; offset < file.length; offset += CHUNK_SIZE) {
        const chunkName = `${slug}-part${chunkIndex + 1}.chunk`;
        const chunkPath = path.join('/path/to/store/files', chunkName);
        await fs.writeFile(chunkPath, file.slice(offset, offset + CHUNK_SIZE));
        chunkPaths.push(chunkName);
        chunkIndex++;
    }

    // Save metadata (including chunk paths) to the database
    await query(
        `INSERT INTO files (slug, filename, password, chunks) VALUES (?, ?, ?, ?)`,
        [slug, filename, hashedPassword, JSON.stringify(chunkPaths)]
    );

    return slug;
}

export async function getFileForDownload(slug: string) {
    const metadata = await getFileMetadata(slug);
    const chunkPaths = JSON.parse(metadata.chunks);
    const combinedFilePath = path.join('/path/to/store/files', `${slug}-combined`);

    const writeStream = createWriteStream(combinedFilePath);

    // Combine all chunks into one file
    for (const chunk of chunkPaths) {
        const chunkPath = path.join('/path/to/store/files', chunk);
        const chunkStream = createReadStream(chunkPath);
        await new Promise((resolve, reject) => {
            chunkStream.pipe(writeStream, { end: false });
            chunkStream.on('end', resolve);
            chunkStream.on('error', reject);
        });
    }

    writeStream.end();

    return createReadStream(combinedFilePath); // Return a stream of the combined file
}

// Delete file and metadata
export async function deleteFile(slug: string) {
    const metadata = await getFileMetadata(slug);
    const chunks = JSON.parse(metadata.chunks);
    for (const chunk of chunks) {
        const chunkPath = path.join('/storage/files', chunk);
        await fs.unlink(chunkPath);
    }
    await query(`DELETE FROM files WHERE slug = ?`, [slug]);
}