import {getSnippetForView, getSnippetMetadata, deleteSnippet} from '~~/server/utils/snippets';
import {createJwtToken} from "~/server/utils/helpers";

export default defineEventHandler(async (event) => {
    const snippetId = event.context.params.snippetId;
    // Attempt to read the request body if present (e.g., for POST requests)
    let password = '';
    if (event.req.method === 'POST') {
        const body = await readBody(event) || {}; // Default to an empty object if no body is present
        password = body.password || ''; // Extract the password if provided
    }
    try {
        const metadata = await getSnippetMetadata(snippetId);

        const now = new Date();
        if (metadata.expiration_date && new Date(metadata.expiration_date) < now) {
            await deleteSnippet(snippetId);
            return createError({
                statusCode: 400,
                message: 'This snippet has expired',
            });
        }

        if (metadata.password) {
            if (!password) {
                // If no password provided, return an error for password protection
                return createError({
                    statusCode: 401,
                    message: 'Password is required to view this snippet',
                });
            }
            // Validate password and return snippet if correct
            await validateSnippetAccess(snippetId, password);
            const token = createJwtToken(snippetId);
            return {
                title: metadata.title,
                code: await getSnippetForView(snippetId),
                token, // Return JWT token for download
            };
        }
        // Return snippet directly if no password is required
        return {
            title: metadata.title,
            expiration_date: metadata.expiration_date,
            code: await getSnippetForView(snippetId),
        };
    } catch (error) {
        throw createError({
            statusCode: 404,
            message: 'Snippet not found',
        });
    }
});