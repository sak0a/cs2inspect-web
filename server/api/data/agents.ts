import {getAgentData} from '~/server/utils/csgoData';
import {APIAgent} from "~/server/utils/interfaces";

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const agentData = getAgentData();

    // Filter skins based on query parameters
    const filteredAgents = agentData?.filter((agent: any) => {
        return Object.keys(query).every((key) => {
            // Check if the skin has the property and if it matches the query
            if (key in agent) {
                const queryValue = query[key] as string; // Cast to string for comparison
                const agentValue = agent[key];

                // Handle nested objects (like rarity)
                if (typeof agentValue === 'object' && agentValue !== null) {
                    return agentValue.id === queryValue || agentValue.name === queryValue || agentValue.color === queryValue;
                }

                // For other fields, perform a direct comparison
                return agentValue === queryValue;
            }
            return true; // If the key doesn't exist in the skin, ignore it
        });
    });

    return { agents: filteredAgents };
});
