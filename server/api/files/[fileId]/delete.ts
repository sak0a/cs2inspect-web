import {getFileMetadata, validateFileAccess, deleteFile} from '~/server/utils/files';

export default defineEventHandler(async (event) => {
    const fileId = event.context.params.fileId;
    const { password } = await readBody(event) || {}; // Optional password from user input

    try {
        // Retrieve file metadata
        const metadata = await getFileMetadata(fileId);

        // If the file requires a password, validate it
        if (metadata.password) {
            if (!password) {
                throw createError({
                    statusCode: 401,
                    message: 'Password is required to delete this file',
                });
            }

            // Validate password
            await validateFileAccess(fileId, password);
        }

        // Proceed with deleting all file chunks from the filesystem
        const chunkPaths = JSON.parse(metadata.chunks);
        for (const chunk of chunkPaths) {
            await fs.unlink(`/path/to/store/files/${chunk}`);
        }

        // Delete file metadata from the database
        await deleteFile(fileId);

        return {
            status: 200,
            message: 'File deleted successfully',
        };
    } catch (error) {
        if (error.code === 'ENOENT') {
            // File not found error when trying to delete the file chunks
            throw createError({
                statusCode: 404,
                message: 'File chunk not found',
            });
        }

        if (error.statusCode === 404) {
            // File not found in the database
            throw createError({
                statusCode: 404,
                message: 'File not found',
            });
        }

        console.error('Error deleting file:', error);
        throw createError({
            statusCode: 500,
            message: 'Failed to delete the file',
        });
    }
});