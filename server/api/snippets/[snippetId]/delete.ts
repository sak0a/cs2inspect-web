import { deleteSnippet, getSnippetMetadata, validateSnippetAccess } from '~~/server/utils/snippets';

export default defineEventHandler(async (event) => {
    const snippetId = event.context.params.snippetId;
    const { password } = await readBody(event) || {}; // Optional password from user input
    try {
        // Retrieve snippet metadata
        const metadata = await getSnippetMetadata(snippetId);

        // If the snippet requires a password, validate it
        if (metadata.password) {
            if (!password) {
                return createError({
                    statusCode: 401,
                    message: 'Password is required to delete this snippet',
                });
            }
            // Validate password
            await validateSnippetAccess(snippetId, password);
        }

        // Delete snippet metadata from the database
        await deleteSnippet(snippetId);

        return {
            status: 200,
            message: 'Snippet deleted successfully',
        };
    } catch (error) {
        if (error.code === 'ENOENT') {
            // File not found error when trying to delete the file
            throw createError({
                statusCode: 404,
                message: 'Snippet file not found',
            });
        }

        if (error.statusCode === 404) {
            // Snippet not found in the database
            throw createError({
                statusCode: 404,
                message: 'Snippet not found',
            });
        }

        console.error('Error deleting snippet:', error);
        throw createError({
            statusCode: 500,
            message: 'Failed to delete the snippet',
        });
    }
});

