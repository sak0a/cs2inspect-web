import { createWriteStream, createReadStream } from 'fs';
import path from 'path';
import archiver from 'archiver'; // For zipping
import bcrypt from 'bcrypt';
import { query } from './db'; // MariaDB connection
import fs from 'fs/promises';
import { generateSlug } from "~/server/utils/slug";
import unzipper from 'unzipper'; // For unzipping

const MAX_SNIPPET_SIZE = 2 * 1024 * 1024; // 2 MB limit
const JWT_SECRET = 'vbh5tva9bne-nau3XTV';
const SNIPPETS_DIR = './storage/snippets';

export async function validateSnippetAccess(snippetId: string, password: string | undefined) {
    const metadata = await getSnippetMetadata(snippetId);

    if (!metadata) {
        throw createError({
            statusCode: 404,
            statusMessage: 'Snippet not found'
        });
    }

    // If a password is required, validate it
    if (metadata.password) {
        if (!password) {
            // If password is required but not provided, throw a 401 error
            throw createError({
                statusCode: 401,
                statusMessage: 'Password required'
            });
        }
        const isValidPassword = await bcrypt.compare(password, metadata.password);
        if (!isValidPassword) {
            // Throw a 401 error if the password is invalid
            throw createError({
                statusCode: 401,
                statusMessage: 'Invalid password'
            });
        }
    }
    // If validation is successful, return the metadata
    return metadata;
}

// Save code snippet as a .txt file inside a .zip
export async function saveSnippet(title: string, code: string, password: string | null, expirationDate: Date) {
    const slug = generateSlug(); // Generate a unique slug for the snippet
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
    const zipPath = path.join(SNIPPETS_DIR, `${slug}.zip`); // Save as a .zip file
    const buffer = Buffer.from(code);
    if (buffer.length > MAX_SNIPPET_SIZE) {
        throw new Error('Snippet exceeds the maximum size of 2 MB');
    }
    try {
        // Check if the directory exists, and create it if it doesn't
        await fs.mkdir(SNIPPETS_DIR, { recursive: true });

        // Create the zip file and add the snippet as a .txt file
        const output = createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        archive.pipe(output);
        archive.append(`Title: ${title}\n\n${code}`, { name: `${slug}.txt` });

        // Finalize the archive to ensure all data is written to the zip file
        await archive.finalize();

        // Wait until the stream is completely written
        await new Promise((resolve, reject) => {
            output.on('close', resolve);
            output.on('error', reject);
        });

        // Save metadata to the database
        await query(
            `INSERT INTO snippets (slug, title, password, path, expiration_date) VALUES (?, ?, ?, ?, ?)`,
            [slug, title, hashedPassword, zipPath, expirationDate]
        );
        return slug; // Return the slug so the user can be redirected to the snippet view page
    } catch (error) {
        console.error('Error saving snippet:', error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to save the snippet'
        });
    }
}

export async function getSnippetForView(slug: string) {
    // Get the metadata for the snippet
    const metadata = await getSnippetMetadata(slug);

    const zipPath = metadata.path; // The path to the .zip file

    // Use unzipper to extract the contents of the zip
    const directory = await unzipper.Open.file(zipPath);
    const file = directory.files.find(file => file.path.endsWith('.txt'));

    if (file) {
        // Extract and return the code content from the .txt file
        const content = await file.buffer();
        return content.toString('utf-8');
    } else {
        throw new Error('Snippet file not found in zip');
    }
}

export async function getSnippetMetadata(slug: string) {
    const result = await query(`SELECT * FROM snippets WHERE slug = ?`, [slug]);
    if (result.length === 0) {
        throw new Error('Snippet not found');
    }
    return result[0];
}

export async function getSnippetForDownload(slug: string) {
    // Get the metadata for the snippet
    const metadata = await getSnippetMetadata(slug);
    const zipPath = metadata.path; // The path to the .zip file
    return createReadStream(zipPath); // Stream the zip file
}

export async function deleteSnippet(slug: string) {
    const metadata = await getSnippetMetadata(slug);
    await fs.unlink(metadata.path);
    await query(`DELETE FROM snippets WHERE slug = ?`, [slug]);
}

