export default defineEventHandler(async (event) => {
    const { title, code, language, password, expiry } = await readBody(event) || {};
    // Check if required fields are present
    console.log(`\n---------- \x1b[104m\x1b[30m ${event._method} API Request Upload Snippet \x1b[0m ----------`);
    if (!title) {
        Logger.error('Missing title field for snippet upload');
        return createStatus(400, 'Missing title field for snippet upload');
    }
    if (!code) {
        Logger.error('Missing code field for snippet upload');
        return createStatus(400, 'Missing code field for snippet upload');
    }
    if (!expiry) {
        Logger.error('Missing expiry field for snippet upload');
        return createStatus(400, 'Missing expiry field for snippet upload');
    }
    if (!language) {
        Logger.error('Missing language field for snippet upload');
        return createStatus(400, 'Missing language field for snippet upload');
    }

    Logger.info('All required fields are present, proceeding to save snippet');
    Logger.info(`Snippet does ${password ? '' : 'not'} require password`);
    const expirationDate: Date | null = convertExpirationDate(expiry);
    const slug: string = await saveSnippet(title, code, language, password, expirationDate);

    Logger.success('Snippet saved successfully');
    Logger.success(`Slug: ${slug}`);
    return { slug }; // Return the generated slug as response to the client
});


// TODO:
//  - Add new snippet view page; check
//  - new one time check while opening the url; ??? (maybe not needed / check)
//  - look for the JWT-Secrets and implement to use it from the .env file instead of hardcoding it;
//  -> 1. Fetch is if the snippet exists or not,
//      -> then if it has been expired or not
//      -> then the if its public (Password Protected) or not
//      -> as response to the client: if it does not exists or is expired, just return this info,
//      -> if it exists and is not public, then return this info and ask for password from the client with a modal form
//      -> on password submit, check if the password is correct or not, then return the snippet content
//      -> if the snippet is public, then return the snippet content directly
//  - add a delete snippet feature, if password is correct
//  - maybe add a Dashboard later for admins, or for the user with login and all saved snippets
//  - automatically show snippets for the user if logged in, also can delete then...
//  - add a feature to update the snippet, if password is correct (or user is logged in)
//  - add a feature to share the snippet with a link, and also with a password
//  - add a feature to change the language for viewing (does not change the database language, just for client side viewing)
//  - add a live countdown from the expiry date to the current date (if its under 80% of original time, then show warn color, under 30% red color)
//  - create single branches for each feature, and then merge them to the main branch (maybe)