export default defineEventHandler(async (event) => {
    const startTime = Date.now(); // Start the timer
    const authToken = getHeader(event, 'Authorization')?.replace('Bearer ', ''); // Extract the token from the headers
    const snippetId = event.context.params.snippetId;

    console.log(`\n---------- \x1b[104m\x1b[30m ${event._method} API Request /snippet/${snippetId}/delete \x1b[0m ----------`);

    // Retrieve snippet metadata
    const validationResponse = await validateSnippet(event, snippetId);
    if (validationResponse.statusCode !== 200) {
        const responseTime = Date.now() - startTime; // Calculate response time
        Logger.info(`Response Time: ${responseTime}ms`);
        return createStatus(validationResponse.statusCode, validationResponse.statusMessage);
    }
    const metadata = validationResponse.metadata;

    // Validate the authentication
    const result = await validateAuth(metadata, authToken, null,
        async () => {
            try {
                Logger.success('Deleting snippet');
                await deleteSnippet(metadata.slug);
            } catch (error) {
                Logger.error('Error deleting snippet:', error);
                return createStatus(500, 'Error deleting the snippet');
            }
            return createStatus(200, 'Snippet deleted successfully');
        }, () => {
            Logger.error('Unauthorized: Password required');
            return createStatus(401, 'Unauthorized: Password required');
        }, () => {
            Logger.error('Unauthorized: No authentication provided');
            return createStatus(401, 'Unauthorized: No authentication provided');
        });
    const responseTime = Date.now() - startTime; // Calculate response time
    Logger.info(`Response Time: ${responseTime}ms`);
    return result;
});

