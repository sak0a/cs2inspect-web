import {saveFiles} from "~/server/utils/files";


export default defineEventHandler(async (event) => {
    const { files, filenames, password, expiry } = await readBody(event);
    Logger.header(`${event._method} API Request Upload Files`);

    if (!files) {
        Logger.error('Missing files to upload');
        return createStatus(400, 'Missing files to upload');
    }
    if (!filenames) {
        Logger.error('Missing filenames to upload');
        return createStatus(400, 'Missing filenames to upload');
    }
    if (!expiry) {
        Logger.error('Missing expiry field for file upload');
        return createStatus(400, 'Missing expiry field for file upload');
    }

    Logger.info('All required fields are present, proceeding to save files');
    const expirationDate: Date | null = convertExpirationDate(expiry);

    // Validate authentication if required
    const slug: string = await saveFiles(files, filenames, password, expirationDate);

    Logger.success('Files saved successfully');
    Logger.success(`Slug: ${slug}`);
    return { slug }
});