import {getData, tableMap, updateData, deleteData, dataExists, createData} from "~/server/database/skins";
import {toJSON} from "flatted";


export default defineEventHandler(async (event) => {
    const method = event.method
    const type = getQuery(event).type as string
    const table = tableMap[type as string]

    if (!table) {
        throw createError({
            statusCode: 400,
            message: 'Invalid weapon type'
        })
    }

    let body, id
    try {
        switch (method) {
            case 'GET':
                body = await readBody(event)
                const weapon = getData(table, body)
                if (!weapon) {
                    throw createError({
                        statusCode: 404,
                        message: 'Weapon not found'
                    })
                }
                return toJSON(weapon)

            case 'PUT':
                id = getQuery(event).id as string
                if (!id) {
                    throw createError({
                        statusCode: 400,
                        message: 'Invalid weapon id'
                    })
                }

                if (!await dataExists(table, {"id": id})) {
                    throw createError({
                        statusCode: 404,
                        message: 'Weapon not found'
                    })
                }
                body = await readBody(event)
                await updateData(table, id, body)
                return { message: 'Weapon updated successfully' }

            case 'DELETE':
                id = getQuery(event).id as string
                if (!id) {
                    throw createError({
                        statusCode: 400,
                        message: 'Invalid weapon id'
                    })
                }
                if (!await dataExists(table, {"id": id})) {
                    throw createError({
                        statusCode: 404,
                        message: 'Weapon not found'
                    })
                }
                await deleteData(table, id)
                return { message: 'Weapon deleted successfully' }
            case 'POST':
                // Only allow creating a weapon if it doesn't already exist
                body = await readBody(event)
                if (await dataExists(table, {
                    steamid: body.steamid,
                    loadoutid: body.loadoutid,
                    defindex: body.defindex
                })) {
                    throw createError({
                        statusCode: 409,
                        message: 'Weapon already exists'
                    })
                }
                await createData(table, body)
                return { message: 'Weapon created successfully' }
            default:
                throw createError({
                    statusCode: 405,
                    message: 'Method not allowed'
                })
        }
    } catch (error) {
        console.error(`Failed to ${method} weapon:`, error)
        throw createError({
            statusCode: 500,
            message: `Failed to ${method} weapon`
        })
    }
})