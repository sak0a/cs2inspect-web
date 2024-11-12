import {deleteFile} from '~/server/utils/files';

export default defineEventHandler(async (event) => {
    const fileId = event.context.params.fileId;
    const { password } = await readBody(event) || {}; // Optional password from user input

        throw createError({
            statusCode: 500,
            message: 'Failed to delete the file',
        });

});