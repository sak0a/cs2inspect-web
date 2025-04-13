import { IDefaultItem } from "~/server/utils/interfaces";

export const PROTECTED_API_PATHS = [
    '/api/weapons',
    '/api/loadouts',
    '/api/knifes',
    '/api/knfies/save',
    '/api/weapons/save',
    '/api/weapons/inspect',
    '/api/weapons/[type]',
    '/api/auth/'
]

export const DEFAULT_WEAPONS: IDefaultItem[] = [
    {
        weapon_defindex: 1,
        weapon_name: "weapon_deagle",
        paintIndex: 0,
        defaultImage:
            "https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins/weapon_deagle.png",
        defaultName: "Desert Eagle",
        category: "pistols",
        availableTeams: "both"
    },
    {
        weapon_defindex: 2,
        weapon_name: "weapon_elite",
        paintIndex: 0,
        defaultImage:
            "https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins/weapon_elite.png",
        defaultName: "Dual Berettas",
        category: "pistols",
        availableTeams: "both"
    },
    {
        weapon_defindex: 3,
        weapon_name: "weapon_fiveseven",
        paintIndex: 0,
        defaultImage:
            "https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins/weapon_fiveseven.png",
        defaultName: "Five-SeveN",
        category: "pistols",
        availableTeams: "counter-terrorists"
    },
    {
        weapon_defindex: 4,
        weapon_name: "weapon_glock",
        paintIndex: 0,
        defaultImage:
            "https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins/weapon_glock.png",
        defaultName: "Glock-18",
        category: "pistols",
        availableTeams: "terrorists"
    },
    {
        weapon_defindex: 7,
        weapon_name: "weapon_ak47",
        paintIndex: 0,
        defaultImage:
            "https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins/weapon_ak47.png",
        defaultName: "AK-47",
        category: "rifles",
        availableTeams: "terrorists"
    },
    {
        weapon_defindex: 8,
        weapon_name: "weapon_aug",
        paintIndex: 0,
        defaultImage:
            "https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins/weapon_aug.png",
        defaultName: "AUG",
        category: "rifles",
        availableTeams: "counter-terrorists"
    },
    {
        weapon_defindex: 9,
        weapon_name: "weapon_awp",
        paintIndex: 0,
        defaultImage:
            "https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins/weapon_awp.png",
        defaultName: "AWP",
        category: "rifles",
        availableTeams: "both"
    },
    {
        weapon_defindex: 10,
        weapon_name: "weapon_famas",
        paintIndex: 0,
        defaultImage:
            "https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins/weapon_famas.png",
        defaultName: "FAMAS",
        category: "rifles",
        availableTeams: "counter-terrorists"
    },
    {
        weapon_defindex: 11,
        weapon_name: "weapon_g3sg1",
        paintIndex: 0,
        defaultImage:
            "https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins/weapon_g3sg1.png",
        defaultName: "G3SG1",
        category: "rifles",
        availableTeams: "terrorists"
    },
    {
        weapon_defindex: 13,
        weapon_name: "weapon_galilar",
        paintIndex: 0,
        defaultImage:
            "https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins/weapon_galilar.png",
        defaultName: "Galil AR",
        category: "rifles",
        availableTeams: "terrorists"
    },
    {
        weapon_defindex: 14,
        weapon_name: "weapon_m249",
        paintIndex: 0,
        defaultImage:
            "https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins/weapon_m249.png",
        defaultName: "M249",
        category: "heavys",
        availableTeams: "both"
    },
    {
        weapon_defindex: 16,
        weapon_name: "weapon_m4a1",
        paintIndex: 0,
        defaultImage:
            "https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins/weapon_m4a1.png",
        defaultName: "M4A4",
        category: "rifles",
        availableTeams: "counter-terrorists"
    },
    {
        weapon_defindex: 17,
        weapon_name: "weapon_mac10",
        paintIndex: 0,
        defaultImage:
            "https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins/weapon_mac10.png",
        defaultName: "MAC-10",
        category: "smgs",
        availableTeams: "terrorists"
    },
    {
        weapon_defindex: 19,
        weapon_name: "weapon_p90",
        paintIndex: 0,
        defaultImage:
            "https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins/weapon_p90.png",
        defaultName: "P90",
        category: "smgs",
        availableTeams: "both"
    },
    {
        weapon_defindex: 23,
        weapon_name: "weapon_mp5sd",
        paintIndex: 0,
        defaultImage:
            "https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins/weapon_mp5sd.png",
        defaultName: "MP5-SD",
        category: "smgs",
        availableTeams: "both"
    },
    {
        weapon_defindex: 24,
        weapon_name: "weapon_ump45",
        paintIndex: 0,
        defaultImage:
            "https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins/weapon_ump45.png",
        defaultName: "UMP-45",
        category: "smgs",
        availableTeams: "both"
    },
    {
        weapon_defindex: 25,
        weapon_name: "weapon_xm1014",
        paintIndex: 0,
        defaultImage:
            "https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins/weapon_xm1014.png",
        defaultName: "XM1014",
        category: "heavys",
        availableTeams: "both"
    },
    {
        weapon_defindex: 26,
        weapon_name: "weapon_bizon",
        paintIndex: 0,
        defaultImage:
            "https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins/weapon_bizon.png",
        defaultName: "PP-Bizon",
        category: "smgs",
        availableTeams: "both"
    },
    {
        weapon_defindex: 27,
        weapon_name: "weapon_mag7",
        paintIndex: 0,
        defaultImage:
            "https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins/weapon_mag7.png",
        defaultName: "MAG-7",
        category: "heavys",
        availableTeams: "counter-terrorists"
    },
    {
        weapon_defindex: 28,
        weapon_name: "weapon_negev",
        paintIndex: 0,
        defaultImage:
            "https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins/weapon_negev.png",
        defaultName: "Negev",
        category: "heavys",
        availableTeams: "both"
    },
    {
        weapon_defindex: 29,
        weapon_name: "weapon_sawedoff",
        paintIndex: 0,
        defaultImage:
            "https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins/weapon_sawedoff.png",
        defaultName: "Sawed-Off",
        category: "heavys",
        availableTeams: "terrorists"
    },
    {
        weapon_defindex: 30,
        weapon_name: "weapon_tec9",
        paintIndex: 0,
        defaultImage:
            "https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins/weapon_tec9.png",
        defaultName: "Tec-9",
        category: "pistols",
        availableTeams: "terrorists"
    },
    {
        weapon_defindex: 31,
        weapon_name: "weapon_taser",
        paintIndex: 0,
        defaultImage:
            "https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins/weapon_taser.png",
        defaultName: "Zeus x27",
        category: "Melee",
        availableTeams: "both"
    },
    {
        weapon_defindex: 32,
        weapon_name: "weapon_hkp2000",
        paintIndex: 0,
        defaultImage:
            "https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins/weapon_hkp2000.png",
        defaultName: "P2000",
        category: "pistols",
        availableTeams: "counter-terrorists"
    },
    {
        weapon_defindex: 33,
        weapon_name: "weapon_mp7",
        paintIndex: 0,
        defaultImage:
            "https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins/weapon_mp7.png",
        defaultName: "MP7",
        category: "smgs",
        availableTeams: "both"
    },
    {
        weapon_defindex: 34,
        weapon_name: "weapon_mp9",
        paintIndex: 0,
        defaultImage:
            "https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins/weapon_mp9.png",
        defaultName: "MP9",
        category: "smgs",
        availableTeams: "counter-terrorists"
    },
    {
        weapon_defindex: 35,
        weapon_name: "weapon_nova",
        paintIndex: 0,
        defaultImage:
            "https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins/weapon_nova.png",
        defaultName: "Nova",
        category: "heavys",
        availableTeams: "both"
    },
    {
        weapon_defindex: 36,
        weapon_name: "weapon_p250",
        paintIndex: 0,
        defaultImage:
            "https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins/weapon_p250.png",
        defaultName: "P250",
        category: "pistols",
        availableTeams: "both"
    },
    {
        weapon_defindex: 38,
        weapon_name: "weapon_scar20",
        paintIndex: 0,
        defaultImage:
            "https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins/weapon_scar20.png",
        defaultName: "SCAR-20",
        category: "rifles",
        availableTeams: "counter-terrorists"
    },
    {
        weapon_defindex: 39,
        weapon_name: "weapon_sg556",
        paintIndex: 0,
        defaultImage:
            "https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins/weapon_sg556.png",
        defaultName: "SG 553",
        category: "rifles",
        availableTeams: "terrorists"
    },
    {
        weapon_defindex: 40,
        weapon_name: "weapon_ssg08",
        paintIndex: 0,
        defaultImage:
            "https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins/weapon_ssg08.png",
        defaultName: "SSG 08",
        category: "rifles",
        availableTeams: "both"
    },
    {
        weapon_defindex: 60,
        weapon_name: "weapon_m4a1_silencer",
        paintIndex: 0,
        defaultImage:
            "https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins/weapon_m4a1_silencer.png",
        defaultName: "M4A1-S",
        category: "rifles",
        availableTeams: "counter-terrorists"
    },
    {
        weapon_defindex: 61,
        weapon_name: "weapon_usp_silencer",
        paintIndex: 0,
        defaultImage:
            "https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins/weapon_usp_silencer.png",
        defaultName: "USP-S",
        category: "pistols",
        availableTeams: "counter-terrorists"
    },
    {
        weapon_defindex: 63,
        weapon_name: "weapon_cz75a",
        paintIndex: 0,
        defaultImage:
            "https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins/weapon_cz75a.png",
        defaultName: "CZ75-Auto",
        category: "pistols",
        availableTeams: "both"
    },
    {
        weapon_defindex: 64,
        weapon_name: "weapon_revolver",
        paintIndex: 0,
        defaultImage:
            "https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins/weapon_revolver.png",
        defaultName: "R8 Revolver",
        category: "pistols",
        availableTeams: "both"
    }
]

export const VALID_WEAPON_DEFINDEXES = DEFAULT_WEAPONS.reduce((acc, weapon) => {
    acc[weapon.weapon_defindex] = true;
    return acc;
}, {} as Record<number, boolean>);

export const DEFAULT_KNIFES: IDefaultItem[] = [
    {
        weapon_defindex: 500,
        weapon_name: "weapon_bayonet",
        defaultName: "Bayonet",
        defaultImage: "https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/panorama/images/econ/weapons/base_weapons/weapon_bayonet_png.png",
        category: "knife",
        paintIndex: 0,
        availableTeams: "both"
    },
    {
        weapon_defindex: 503,
        weapon_name: "weapon_knife_css",
        defaultName: "Classic Knife",
        defaultImage: "https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/panorama/images/econ/weapons/base_weapons/weapon_knife_css_png.png",
        category: "knife",
        paintIndex: 0,
        availableTeams: "both"
    },
    {
        weapon_defindex: 505,
        weapon_name: "weapon_knife_flip",
        defaultName: "Flip Knife",
        defaultImage: "https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/panorama/images/econ/weapons/base_weapons/weapon_knife_flip_png.png",
        category: "knife",
        paintIndex: 0,
        availableTeams: "both"
    },
    {
        weapon_defindex: 506,
        weapon_name: "weapon_knife_gut",
        defaultName: "Gut Knife",
        defaultImage: "https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/panorama/images/econ/weapons/base_weapons/weapon_knife_gut_png.png",
        category: "knife",
        paintIndex: 0,
        availableTeams: "both"
    },
    {
        weapon_defindex: 507,
        weapon_name: "weapon_knife_karambit",
        defaultName: "Karambit",
        defaultImage: "https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/panorama/images/econ/weapons/base_weapons/weapon_knife_karambit_png.png",
        category: "knife",
        paintIndex: 0,
        availableTeams: "both"
    },
    {
        weapon_defindex: 508,
        weapon_name: "weapon_knife_m9_bayonet",
        defaultName: "M9 Bayonet",
        defaultImage: "https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/panorama/images/econ/weapons/base_weapons/weapon_knife_m9_bayonet_png.png",
        category: "knife",
        paintIndex: 0,
        availableTeams: "both"
    },
    {
        weapon_defindex: 509,
        weapon_name: "weapon_knife_tactical",
        defaultName: "Huntsman Knife",
        defaultImage: "https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/panorama/images/econ/weapons/base_weapons/weapon_knife_tactical_png.png",
        category: "knife",
        paintIndex: 0,
        availableTeams: "both"
    },
    {
        weapon_defindex: 512,
        weapon_name: "weapon_knife_falchion",
        defaultName: "Falchion Knife",
        defaultImage: "https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/panorama/images/econ/weapons/base_weapons/weapon_knife_falchion_png.png",
        category: "knife",
        paintIndex: 0,
        availableTeams: "both"
    },
    {
        weapon_defindex: 514,
        weapon_name: "weapon_knife_survival_bowie",
        defaultName: "Bowie Knife",
        defaultImage: "https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/panorama/images/econ/weapons/base_weapons/weapon_knife_survival_bowie_png.png",
        category: "knife",
        paintIndex: 0,
        availableTeams: "both"
    },
    {
        weapon_defindex: 515,
        weapon_name: "weapon_knife_butterfly",
        defaultName: "Butterfly Knife",
        defaultImage: "https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/panorama/images/econ/weapons/base_weapons/weapon_knife_butterfly_png.png",
        category: "knife",
        paintIndex: 0,
        availableTeams: "both"
    },
    {
        weapon_defindex: 516,
        weapon_name: "weapon_knife_push",
        defaultName: "Shadow Daggers",
        defaultImage: "https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/panorama/images/econ/weapons/base_weapons/weapon_knife_push_png.png",
        category: "knife",
        paintIndex: 0,
        availableTeams: "both"
    },
    {
        weapon_defindex: 517,
        weapon_name: "weapon_knife_cord",
        defaultName: "Paracord Knife",
        defaultImage: "https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/panorama/images/econ/weapons/base_weapons/weapon_knife_cord_png.png",
        category: "knife",
        paintIndex: 0,
        availableTeams: "both"
    },
    {
        weapon_defindex: 518,
        weapon_name: "weapon_knife_canis",
        defaultName: "Survival Knife",
        defaultImage: "https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/panorama/images/econ/weapons/base_weapons/weapon_knife_canis_png.png",
        category: "knife",
        paintIndex: 0,
        availableTeams: "both"
    },
    {
        weapon_defindex: 519,
        weapon_name: "weapon_knife_ursus",
        defaultName: "Ursus Knife",
        defaultImage: "https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/panorama/images/econ/weapons/base_weapons/weapon_knife_ursus_png.png",
        category: "knife",
        paintIndex: 0,
        availableTeams: "both"
    },
    {
        weapon_defindex: 520,
        weapon_name: "weapon_knife_gypsy_jackknife",
        defaultName: "Navaja Knife",
        defaultImage: "https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/panorama/images/econ/weapons/base_weapons/weapon_knife_gypsy_jackknife_png.png",
        category: "knife",
        paintIndex: 0,
        availableTeams: "both"
    },
    {
        weapon_defindex: 521,
        weapon_name: "weapon_knife_outdoor",
        defaultName: "Nomad Knife",
        defaultImage: "https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/panorama/images/econ/weapons/base_weapons/weapon_knife_outdoor_png.png",
        category: "knife",
        paintIndex: 0,
        availableTeams: "both"
    },
    {
        weapon_defindex: 522,
        weapon_name: "weapon_knife_stiletto",
        defaultName: "Stiletto Knife",
        defaultImage: "https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/panorama/images/econ/weapons/base_weapons/weapon_knife_stiletto_png.png",
        category: "knife",
        paintIndex: 0,
        availableTeams: "both"
    },
    {
        weapon_defindex: 523,
        weapon_name: "weapon_knife_widowmaker",
        defaultName: "Talon Knife",
        defaultImage: "https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/panorama/images/econ/weapons/base_weapons/weapon_knife_widowmaker_png.png",
        category: "knife",
        paintIndex: 0,
        availableTeams: "both"
    },
    {
        weapon_defindex: 525,
        weapon_name: "weapon_knife_skeleton",
        defaultName: "Skeleton Knife",
        defaultImage: "https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/panorama/images/econ/weapons/base_weapons/weapon_knife_skeleton_png.png",
        category: "knife",
        paintIndex: 0,
        availableTeams: "both"
    },
    {
        weapon_defindex: 526,
        weapon_name: "weapon_knife_kukri",
        defaultName: "Kukri Knife",
        defaultImage: "https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/panorama/images/econ/weapons/base_weapons/weapon_knife_kukri_png.png",
        category: "knife",
        paintIndex: 0,
        availableTeams: "both"
    }
]

export const VALID_KNIFE_DEFINDEXES = DEFAULT_KNIFES.reduce((acc, knife) => {
    acc[knife.weapon_defindex] = true;
    return acc;
}, {} as Record<number, boolean>);

export const DEFAULT_GLOVES = [
    {
        weapon_defindex: 5027, // Bloodhound Gloves
        weapon_name: "studded_bloodhound_gloves",
        defaultName: "Bloodhound Gloves",
        defaultImage: "https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/panorama/images/econ/weapons/base_weapons/studded_bloodhound_gloves_png.png",
        category: "glove",
        paintIndex: 0,
        availableTeams: "both"
    },
    {
        weapon_defindex: 4725, // Broken Fang Gloves
        weapon_name: "studded_brokenfang_gloves",
        defaultName: "Broken Fang Gloves",
        defaultImage: "https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/panorama/images/econ/weapons/base_weapons/studded_brokenfang_gloves_png.png",
        category: "glove",
        paintIndex: 0,
        availableTeams: "both"
    },
    {
        weapon_defindex: 5031, // Driver Gloves
        weapon_name: "slick_gloves",
        defaultName: "Driver Gloves",
        defaultImage: "https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/panorama/images/econ/weapons/base_weapons/slick_gloves_png.png",
        category: "glove",
        paintIndex: 0,
        availableTeams: "both"
    },
    {
        weapon_defindex: 5032, // Hand Wraps
        weapon_name: "leather_handwraps",
        defaultName: "Hand Wraps",
        defaultImage: "https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/panorama/images/econ/weapons/base_weapons/leather_handwraps_png.png",
        category: "glove",
        paintIndex: 0,
        availableTeams: "both"
    },
    {
        weapon_defindex: 5035, // Hydra Gloves
        weapon_name: "studded_hydra_gloves",
        defaultName: "Hydra Gloves",
        defaultImage: "https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/panorama/images/econ/weapons/base_weapons/studded_hydra_gloves_png.png",
        category: "glove",
        paintIndex: 0,
        availableTeams: "both"
    },
    {
        weapon_defindex: 5033, // Moto Gloves
        weapon_name: "motorcycle_gloves",
        defaultName: "Moto Gloves",
        defaultImage: "https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/panorama/images/econ/weapons/base_weapons/motorcycle_gloves_png.png",
        category: "glove",
        paintIndex: 0,
        availableTeams: "both"
    },
    {
        weapon_defindex: 5034, // Specialist Gloves
        weapon_name: "specialist_gloves",
        defaultName: "Specialist Gloves",
        defaultImage: "https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/panorama/images/econ/weapons/base_weapons/specialist_gloves_png.png",
        category: "glove",
        paintIndex: 0,
        availableTeams: "both"
    },
    {
        weapon_defindex: 5030, // Sport Gloves
        weapon_name: "sporty_gloves",
        defaultName: "Sport Gloves",
        defaultImage: "https://raw.githubusercontent.com/ByMykel/counter-strike-image-tracker/main/static/panorama/images/econ/weapons/base_weapons/sporty_gloves_png.png",
        category: "glove",
        paintIndex: 0,
        availableTeams: "both"
    }
];

export const VALID_GLOVE_DEFINDEXES = DEFAULT_GLOVES.reduce((acc, glove) => {
    acc[glove.weapon_defindex] = true;
    return acc;
}, {} as Record<number, boolean>);

const DEFINDEXES = {
    weapon_deagle: 1,
    weapon_elite: 2,
    weapon_fiveseven: 3,
    weapon_glock: 4,
    weapon_ak47: 7,
    weapon_aug: 8,
    weapon_awp: 9,
    weapon_famas: 10,
    weapon_g3sg1: 11,
    weapon_galil: 13,
    weapon_m249: 14,
    weapon_m4a1: 16,
    weapon_mac10: 17,
    weapon_p90: 19,
    weapon_mp5sd: 23,
    weapon_ump45: 24,
    weapon_xm1014: 25,
    weapon_bizon: 26,
    weapon_mag7: 27,
    weapon_negev: 28,
    weapon_sawedoff: 29,
    weapon_tec9: 30,
    weapon_taser: 31,
    weapon_hkp2000: 32,
    weapon_mp7: 33,
    weapon_mp9: 34,
    weapon_nova: 35,
    weapon_p250: 36,
    weapon_shield: 37,
    weapon_scar20: 38,
    weapon_sg556: 39,
    weapon_ssg08: 40,
    weapon_knifegg: 41,
    weapon_knife: 42,
    weapon_flashbang: 43,
    weapon_hegrenade: 44,
    weapon_smokegrenade: 45,
    weapon_molotov: 46,
    weapon_decoy: 47,
    weapon_incgrenade: 48,
    weapon_c4: 49,
    weapon_healthshot: 57,
    weapon_knife_t: 59,
    weapon_m4a1_silencer: 60,
    weapon_usp_silencer: 61,
    weapon_cz75a: 63,
    weapon_revolver: 64,
    weapon_tagrenade: 68,
    weapon_fists: 69,
    weapon_breachcharge: 70,
    weapon_tablet: 72,
    weapon_melee: 74,
    weapon_axe: 75,
    weapon_hammer: 76,
    weapon_spanner: 78,
    weapon_knife_ghost: 80,
    weapon_firebomb: 81,
    weapon_diversion: 82,
    weapon_frag_grenade: 83,
    weapon_snowball: 84,
    weapon_bumpmine: 85,
    weapon_bayonet: 500,
    weapon_knife_css: 503,
    weapon_knife_flip: 505,
    weapon_knife_gut: 506,
    weapon_knife_karambit: 507,
    weapon_knife_m9_bayonet: 508,
    weapon_knife_tactical: 509,
    weapon_knife_falchion: 512,
    weapon_knife_survival_bowie: 514,
    weapon_knife_butterfly: 515,
    weapon_knife_push: 516,
    weapon_knife_cord: 517,
    weapon_knife_canis: 518,
    weapon_knife_ursus: 519,
    weapon_knife_gypsy_jackknife: 520,
    weapon_knife_outdoor: 521,
    weapon_knife_stiletto: 522,
    weapon_knife_widowmaker: 523,
    weapon_knife_skeleton: 525,
    weapon_knife_kukri: 526,
    studded_brokenfang_gloves: 4725,
    studded_bloodhound_gloves: 5027,
    sporty_gloves: 5030,
    slick_gloves: 5031,
    leather_handwraps: 5032,
    motorcycle_gloves: 5033,
    specialist_gloves: 5034,
    studded_hydra_gloves: 5035
}