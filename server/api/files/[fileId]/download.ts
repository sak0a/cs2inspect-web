import { getQuery } from 'h3'; // Import getQuery from h3

export default defineEventHandler(async (event) => {
    const query = getQuery(event); // Use getQuery to extract query parameters
    const token = query.token; // Extract the token from the query

    return "";
});