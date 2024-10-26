export default defineEventHandler(async (event) => {
    const authToken = getHeader(event, 'Authorization')?.replace('Bearer ', ''); // Extract the token from the query
    const snippetId = event.context.params.snippetId;

    console.log(`\n---------- \x1b[104m\x1b[30m ${event._method} API Request /snippet/${snippetId}/download \x1b[0m ----------`);
    // Retrieve snippet metadata
    const validationResponse = await validateSnippet(event, snippetId);
    if (validationResponse.statusCode !== 200) {
        return createStatus(validationResponse.statusCode, validationResponse.statusMessage);
    }
    const metadata = validationResponse.metadata;

    // Validate the authentication
    return await validateAuth(metadata, authToken, null,
        async () => {
            Logger.success('Returning snippet for download');
            const snippetStream = await getSnippetForDownload(metadata.slug);
            event.node.res.setHeader('Content-Disposition', `attachment; filename="${metadata.slug}.zip"`);
            return snippetStream;
        }, () => {}, () => {});
});