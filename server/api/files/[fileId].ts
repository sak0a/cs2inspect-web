import { validateFileAccess } from '~~/server/utils/files';

export default defineEventHandler(async (event) => {
    const fileId = event.context.params.fileId;
    const { password } = await readBody(event); // Password entered by user
    // Retrieve metadata to check if a password is required
    const metadata = await getFileMetadata(fileId);
    // If a password is required, validate it and issue a JWT token
    if (metadata.password) {
        await validateFileAccess(fileId, password);
        const token = createJwtToken(fileId);
        return {
            filename: metadata.filename,
            token, // Include JWT token if password validation was needed
        };
    }
    // If no password is required, no token needed
    return {
        filename: metadata.filename,
    };
});