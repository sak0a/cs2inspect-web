export default defineEventHandler(async (event) => {
    const snippetId: string = event.context.params.snippetId;
    const authToken: string | undefined = getHeader(event, 'Authorization')?.replace('Bearer ', ''); // Extract the token from the query
    // Attempt to read the request body if present (e.g., for POST requests)
    let password: string | undefined;
    if (event._method === 'POST') {
        const body = await readBody(event) || {};
        password = body.password || '';
    }

    console.log(`\n---------- \x1b[104m\x1b[30m ${event._method} API Request /snippet/${snippetId} \x1b[0m ----------`);
    try {
        // Retrieve snippet metadata
        const validationResponse= await validateSnippet(event, snippetId);
        if (validationResponse.statusCode !== 200) {
            return createStatus(validationResponse.statusCode, validationResponse.statusMessage);
        }
        const metadata: SnippetData = validationResponse.metadata;

        // Validate the authentication
        return await validateAuth(metadata, authToken, password,
            async (): Promise<any> => {
            Logger.success('Returning snippet with Token authentication');
            return {
                title: metadata.title,
                expiration_date: metadata.expiration_date,
                language: metadata.language,
                code: await getSnippetContent(snippetId),
            };
            },
            async (): Promise<any> => {
            Logger.success('Returning snippet with Password authentication');
            const token = createJwtToken(snippetId);
            return {
                title: metadata.title,
                expiration_date: metadata.expiration_date,
                language: metadata.language,
                code: await getSnippetContent(snippetId),
                token,
            };
            },
            async (): Promise<any> => {
            return {
                title: metadata.title,
                expiration_date: metadata.expiration_date,
                language: metadata.language,
                code: await getSnippetContent(snippetId),
            };
        });
    } catch(error) {
        Logger.error(`Error retrieving snippet: ${error.message}`);
        return createStatus(500, 'Internal server error');
    }
});