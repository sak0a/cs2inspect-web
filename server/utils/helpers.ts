const wordList: string[] = [
    "apple", "banana", "cherry", "date", "elderberry", "fig", "grape", "honeydew", "kiwi", "lemon",
    "mango", "nectarine", "orange", "papaya", "quince", "raspberry", "strawberry", "tangerine", "ugli", "violet",
    "watermelon", "xigua", "yam", "zucchini", "apricot", "blackberry", "blueberry", "cantaloupe", "dragonfruit",
    "guava", "jackfruit", "kumquat", "lime", "mulberry", "nut", "olive", "peach", "plum", "pineapple",
    "pomegranate", "prune", "rowan", "starfruit", "tomato", "vanilla", "walnut", "ximenia", "yuzu", "zapote",
    "almond", "butternut", "coconut", "damson", "elder", "feijoa", "gooseberry", "huckleberry", "imbu",
    "jaboticaba", "kiwano", "litchi", "melon", "nectar", "okra", "peanut", "raisin", "sapote",
    "tamarind", "uva", "valencia", "whitecurrant", "xoconostle", "yellow", "ziziphus", "amaranth", "barley",
    "cassava", "dandelion", "endive", "fennel", "garlic", "horseradish", "iceberg", "jicama", "kale", "lettuce",
    "mustard", "nopal", "oregano", "parsley", "quinoa", "radish", "spinach", "thyme", "urn", "vervain", "watercress",
    "xanthan", "zebra", "anchovy", "bacon", "carrot", "duck", "eggplant", "fettuccine", "gorgonzola", "halibut",
    "ilama", "kelp", "lobster", "miso", "noodle", "oyster", "pasta", "quesadilla", "ravioli", "salmon",
    "tofu", "udon", "veal", "wasabi", "xouba", "yogurt", "zander", "avocado", "broccoli", "cauliflower", "dill",
    "endive", "fiddlehead", "grapefruit", "hazelnut", "indigo", "kohlrabi", "leek", "mint", "nutmeg",
    "persimmon", "rutabaga", "squash", "turnip", "urad", "vinegar", "water", "xanadu", "zinfandel",
    "arugula", "basil", "cilantro", "eggplant", "fennel", "ginger", "iceberg", "broccoli", "kale",
    "cat", "dog", "eagle", "fox", "goat", "hippo", "iguana", "jaguar", "kangaroo", "lion", "monkey", "newt",
    "octopus", "penguin", "quail", "rabbit", "snake", "turtle", "vulture", "wolf", "yak", "zebra",
    "city", "village", "forest", "river", "mountain", "desert", "ocean", "island", "valley", "canyon",
    "book", "pencil", "keyboard", "chair", "lamp", "window", "mirror", "cup", "bottle", "desk"
];

export function generateSlug(wordCount: number | 4): string {
    // Pick 5 random words from the wordList and join them with hyphens
    const selectedWords = [];
    for (let i = 0; i < wordCount; i++) {
        const randomWord = wordList[Math.floor(Math.random() * wordList.length)];
        selectedWords.push(randomWord);
    }
    return selectedWords.join('-');
}

export function generateTitle(): string {
    // Pick a random word from the wordList
    return wordList[Math.floor(Math.random() * wordList.length)];
}

export function generatePassword(): string {
    // Generate a random 8-character password
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return password;
}

export function generateLanguage(): string {
    // Pick a random programming language
    const languages = ['javascript', 'python', 'java', 'c', 'c++', 'c#', 'ruby', 'php', 'swift', 'typescript'];
    return languages[Math.floor(Math.random() * languages.length)];
}

export function generateExpirationDate(): Date {
    // Pick a random expiration date within the next 30 days
    const now = new Date();
    return new Date(now.getTime() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000);
}

export function generateCode(): string {
    // Generate a random code snippet
    return `function ${generateTitle()}() {\n    console.log('Hello, World!');\n}`;
}

export function convertExpirationDate(expiry: string): Date | null {
    const now = new Date();
    switch (expiry) {
        case '1_hour':
            return new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
        case '2_hours':
            return new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours
        case '4_hours':
            return new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours
        case '8_hours':
            return new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8 hours
        case '1_day':
            return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day
        case '1_week':
            return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 week
        case '1_month':
            return new Date(now.setMonth(now.getMonth() + 1)); // 1 month
        case 'permanent':
            return null; // Permanent, no expiration
        default:
            return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Default to 1 week
    }
}

export function createStatus( statusCode: number, statusMessage: string): { statusCode: number, statusMessage: string } {
    return { statusCode, statusMessage};
}