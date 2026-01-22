/**
 * Weapon name mapping utilities for handling different naming conventions
 * between constants and API data
 */

/**
 * Maps weapon names from constants to potential API weapon.id values
 * This handles cases where the API uses different naming conventions
 */
export const WEAPON_NAME_MAPPINGS: Record<string, string[]> = {
    // Weapons - most match directly
    'weapon_deagle': ['weapon_deagle'],
    'weapon_elite': ['weapon_elite'],
    'weapon_fiveseven': ['weapon_fiveseven'],
    'weapon_glock': ['weapon_glock'],
    'weapon_ak47': ['weapon_ak47'],
    'weapon_aug': ['weapon_aug'],
    'weapon_awp': ['weapon_awp'],
    'weapon_famas': ['weapon_famas'],
    'weapon_g3sg1': ['weapon_g3sg1'],
    'weapon_galil': ['weapon_galil'],
    'weapon_m249': ['weapon_m249'],
    'weapon_m4a1': ['weapon_m4a1'],
    'weapon_mac10': ['weapon_mac10'],
    'weapon_p90': ['weapon_p90'],
    'weapon_mp5sd': ['weapon_mp5sd'],
    'weapon_ump45': ['weapon_ump45'],
    'weapon_xm1014': ['weapon_xm1014'],
    'weapon_bizon': ['weapon_bizon'],
    'weapon_mag7': ['weapon_mag7'],
    'weapon_negev': ['weapon_negev'],
    'weapon_sawedoff': ['weapon_sawedoff'],
    'weapon_tec9': ['weapon_tec9'],
    'weapon_hkp2000': ['weapon_hkp2000'],
    'weapon_mp7': ['weapon_mp7'],
    'weapon_mp9': ['weapon_mp9'],
    'weapon_nova': ['weapon_nova'],
    'weapon_p250': ['weapon_p250'],
    'weapon_scar20': ['weapon_scar20'],
    'weapon_sg556': ['weapon_sg556'],
    'weapon_ssg08': ['weapon_ssg08'],
    'weapon_m4a1_silencer': ['weapon_m4a1_silencer'],
    'weapon_usp_silencer': ['weapon_usp_silencer'],
    'weapon_cz75a': ['weapon_cz75a'],
    'weapon_revolver': ['weapon_revolver'],

    // Knives - handle special cases (regular skins + vanilla skins)
    'weapon_bayonet': ['weapon_bayonet', 'sfui_wpnhud_knifebayonet'],
    'weapon_knife_css': ['weapon_knife_css', 'sfui_wpnhud_knifecss'],
    'weapon_knife_flip': ['weapon_knife_flip', 'sfui_wpnhud_knifeflip'],
    'weapon_knife_gut': ['weapon_knife_gut', 'sfui_wpnhud_knifegut'],
    'weapon_knife_karambit': ['weapon_knife_karambit', 'sfui_wpnhud_knifekarambit'],
    'weapon_knife_m9_bayonet': ['weapon_knife_m9_bayonet', 'sfui_wpnhud_knifem9'],
    'weapon_knife_tactical': ['weapon_knife_tactical', 'sfui_wpnhud_knifetactical'],
    'weapon_knife_falchion': ['weapon_knife_falchion', 'sfui_wpnhud_knifefalchion'],
    'weapon_knife_survival_bowie': ['weapon_knife_survival_bowie', 'sfui_wpnhud_knifebowie'],
    'weapon_knife_butterfly': ['weapon_knife_butterfly', 'sfui_wpnhud_knife_butterfly'],
    'weapon_knife_push': ['weapon_knife_push', 'sfui_wpnhud_knifepush'],
    'weapon_knife_cord': ['weapon_knife_cord', 'sfui_wpnhud_knifecord'],
    'weapon_knife_canis': ['weapon_knife_canis', 'sfui_wpnhud_knifecanis'],
    'weapon_knife_ursus': ['weapon_knife_ursus', 'sfui_wpnhud_knifeursus'],
    'weapon_knife_gypsy_jackknife': ['weapon_knife_gypsy_jackknife', 'sfui_wpnhud_knifejackknife'],
    'weapon_knife_outdoor': ['weapon_knife_outdoor', 'sfui_wpnhud_knifeoutdoor'],
    'weapon_knife_stiletto': ['weapon_knife_stiletto', 'sfui_wpnhud_knifestiletto'],
    'weapon_knife_widowmaker': ['weapon_knife_widowmaker', 'sfui_wpnhud_knifewidowmaker'],
    'weapon_knife_skeleton': ['weapon_knife_skeleton', 'sfui_wpnhud_knifeskeleton'],
    'weapon_knife_kukri': ['weapon_knife_kukri', 'sfui_wpnhud_knifekukri'],

    // Gloves - these generally match directly
    'studded_bloodhound_gloves': ['studded_bloodhound_gloves'],
    'studded_brokenfang_gloves': ['studded_brokenfang_gloves'],
    'slick_gloves': ['slick_gloves'],
    'leather_handwraps': ['leather_handwraps'],
    'motorcycle_gloves': ['motorcycle_gloves'],
    'specialist_gloves': ['specialist_gloves'],
    'sporty_gloves': ['sporty_gloves']
};

/**
 * Checks if a weapon query matches any of the possible API weapon.id values
 * @param weaponQuery The weapon name from constants (e.g., 'weapon_bayonet')
 * @param apiWeaponId The weapon.id from API data (e.g., 'sfui_wpnhud_knifebayonet')
 * @returns true if they match, false otherwise
 */
export function isWeaponMatch(weaponQuery: string, apiWeaponId: string): boolean {
    if (!weaponQuery || !apiWeaponId) return false;

    const queryLower = weaponQuery.toLowerCase();
    const apiIdLower = apiWeaponId.toLowerCase();

    // Direct match - highest priority
    if (queryLower === apiIdLower) return true;

    // Check if the API weapon ID is in the explicit mapping for this weapon query
    const mappings = WEAPON_NAME_MAPPINGS[queryLower];
    if (mappings && mappings.some(mapping => mapping.toLowerCase() === apiIdLower)) {
        return true;
    }

    // No fallback patterns - we want exact matches only to prevent cross-contamination
    // between different weapon types (e.g., bayonet skins showing up for butterfly knife)
    return false;
}

/**
 * Gets all possible API weapon.id values for a given weapon query
 * @param weaponQuery The weapon name from constants
 * @returns Array of possible API weapon.id values
 */
export function getPossibleApiWeaponIds(weaponQuery: string): string[] {
    if (!weaponQuery) return [];

    const queryLower = weaponQuery.toLowerCase();
    const mappings = WEAPON_NAME_MAPPINGS[queryLower];
    
    if (mappings) {
        return [...mappings];
    }

    // If no specific mapping exists, return the original query
    return [weaponQuery];
}

/**
 * Normalizes a weapon name for consistent comparison
 * @param weaponName The weapon name to normalize
 * @returns Normalized weapon name
 */
export function normalizeWeaponName(weaponName: string): string {
    if (!weaponName) return '';
    
    return weaponName
        .toLowerCase()
        .trim()
        // Remove common prefixes that might cause mismatches
        .replace(/^sfui_wpnhud_/, '')
        .replace(/^weapon_/, '');
}
