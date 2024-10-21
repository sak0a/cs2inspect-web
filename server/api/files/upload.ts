import { saveFile } from '~~/server/utils/files';

export default defineEventHandler(async (event) => {
    const { file, filename, password } = await readBody(event);

    // Save the file with the filename and optional password
    const slug = await saveFile(file, filename, password);

    return { status: 200, slug };
});