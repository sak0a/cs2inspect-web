const wordList = [
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

export function validateSlug(slug: string): boolean {
    // A valid slug contains only lowercase letters, numbers, and hyphens
    const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    return slugRegex.test(slug);
}