/**
 * Version ID Generator
 *
 * Generates human-readable 2-word IDs for version history entries.
 * Format: "adjective-noun" (e.g., "blue-fox", "swift-hawk")
 */

// Short adjectives (4-6 chars)
const adjectives = [
  'blue',
  'red',
  'gold',
  'dark',
  'wild',
  'fast',
  'cool',
  'bold',
  'calm',
  'deep',
  'epic',
  'fair',
  'gray',
  'keen',
  'loud',
  'mild',
  'neon',
  'pale',
  'pure',
  'rare',
  'rich',
  'soft',
  'tall',
  'warm',
  'wise',
  'aged',
  'big',
  'dry',
  'fit',
  'hot',
  'icy',
  'new',
  'old',
  'raw',
  'shy',
  'sly',
  'wet',
  'odd',
  'zen',
  'dim',
  'slim',
  'grim',
  'iron',
  'jade',
  'onyx',
  'ruby',
  'silk',
  'void',
]

// Short nouns (3-5 chars)
const nouns = [
  'fox',
  'owl',
  'bear',
  'wolf',
  'hawk',
  'lion',
  'deer',
  'crow',
  'dove',
  'frog',
  'goat',
  'hare',
  'kite',
  'lynx',
  'moth',
  'newt',
  'pike',
  'seal',
  'swan',
  'toad',
  'wasp',
  'wren',
  'ape',
  'bat',
  'bee',
  'cat',
  'cod',
  'dog',
  'eel',
  'elk',
  'fly',
  'gnu',
  'ant',
  'ram',
  'ray',
  'yak',
  'orb',
  'arc',
  'gem',
  'sun',
  'moon',
  'star',
  'wind',
  'fire',
  'ice',
  'rock',
  'wave',
  'leaf',
]

/**
 * Generate a random 2-word version ID
 * @returns A string like "blue-fox" or "swift-hawk"
 */
export function generateVersionId(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  return `${adjective}-${noun}`
}

/**
 * Generate a unique version ID that doesn't exist in the provided list
 * @param existingIds - Array of existing version IDs to avoid
 * @param maxAttempts - Maximum number of attempts before giving up
 * @returns A unique version ID
 */
export function generateUniqueVersionId(existingIds: string[] = [], maxAttempts = 50): string {
  const existingSet = new Set(existingIds)

  for (let i = 0; i < maxAttempts; i++) {
    const id = generateVersionId()
    if (!existingSet.has(id)) {
      return id
    }
  }

  // Fallback: append a random number if we can't find a unique combo
  return `${generateVersionId()}-${Math.floor(Math.random() * 99)}`
}
