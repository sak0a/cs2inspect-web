import { getSnippetMetadata } from '~~/server/utils/snippets';

export default defineEventHandler(async (event) => {
    const snippetId = event.context.params.snippetId;
    try {
        const metadata = await getSnippetMetadata(snippetId);
        return {
            passwordRequired: !!metadata.password,
        };
    } catch (error) {
        throw createError({
            statusCode: 404,
            message: 'Snippet not found',
        });
    }
});