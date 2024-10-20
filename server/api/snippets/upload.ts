import { saveSnippet } from '~~/server/utils/snippets';
import { addExpiryDate } from "~/server/utils/helpers";

export default defineEventHandler(async (event) => {
    const { title, code, password, expiry } = await readBody(event) || {};

    // Check if required fields are present
    if (!title || !code || !expiry) {
        throw createError({
            statusCode: 400,
            message: 'Title and code and expiry are required fields',
        });
    }

    const expirationDate = addExpiryDate(expiry);

    // Save the snippet with the title, code, and optional password
    const slug = await saveSnippet(title, code, password, expirationDate);

    return {
        slug, // Return the slug to redirect the user to the newly uploaded snippet
    };
});