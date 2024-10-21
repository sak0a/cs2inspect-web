import { getQuery } from 'h3'; // Import getQuery from h3
import { getFileForDownload, getFileMetadata } from '~~/server/utils/files';
import { verifyJwtToken } from "~/server/utils/helpers";

export default defineEventHandler(async (event) => {
    const query = getQuery(event); // Use getQuery to extract query parameters
    const token = query.token; // Extract the token from the query
    const fileId = event.context.params.fileId;

    // Retrieve file metadata
    const metadata = await getFileMetadata(fileId);

    // If the file requires a password, check for a valid JWT token
    if (metadata.password) {
        if (!token) {
            return { statusCode: 401, message: 'Unauthorized: Token required for download' };
        }

        try {
            const decoded = verifyJwtToken(token);
            if (decoded.fileId !== fileId) {
                throw new Error('Invalid token');
            }
        } catch {
            return { statusCode: 401, message: 'Unauthorized or invalid token' };
        }
    }

    // Stream the file for download
    const fileStream = await getFileForDownload(fileId);
    event.node.res.setHeader('Content-Disposition', `attachment; filename="${metadata.filename}"`);
    return fileStream;
});