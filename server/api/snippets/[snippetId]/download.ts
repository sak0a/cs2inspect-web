import { getQuery } from 'h3';
import {
    deleteSnippet,
    getSnippetForDownload,
    getSnippetMetadata,
    snippetExists
} from '~~/server/utils/snippets';

import {verifyJwtToken} from "~/server/utils/helpers";

export default defineEventHandler(async (event) => {
    const query = getQuery(event); // Use getQuery to extract query parameters
    const token = query.token; // Extract the token from the query
    const snippetId = event.context.params.snippetId;

    // Retrieve snippet metadata
    const metadata = await getSnippetMetadata(snippetId);

    // Check if the snippet is expired
    const now = new Date();
    if (metadata.expiration_date && new Date(metadata.expiration_date) < now) {
        await deleteSnippet(snippetId);
        return createError({
            statusCode: 400,
            message: 'This snippet has already expired',
        });
    }

    if (metadata.password) {
        if (!token) {
            return createError({
                statusCode: 401,
                message: 'Unauthorized: Token required for download'
            });
        }
        try {
            const decoded = verifyJwtToken(token);
            if (decoded.snippetId !== snippetId) {
                return createError({
                    statusCode: 401,
                    message: 'Unauthorized or Invalid token'
                });
            }
        } catch (error) {
            return createError({
                statusCode: 401,
                message: 'Unauthorized or Invalid token'
            });
        }
    }

    const snippetStream = await getSnippetForDownload(snippetId);
    event.node.res.setHeader('Content-Disposition', `attachment; filename="${snippetId}.zip"`);
    return snippetStream;
});