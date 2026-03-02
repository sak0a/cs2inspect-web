/**
 * Convert a hex color string to an RGBA color string
 *
 * @param hex - Hex color string (with or without #)
 * @param alpha - Alpha value (0-1), defaults to '1'
 * @returns RGBA color string
 */
export function hexToRgba(hex: string, alpha: string | number = '1'): string {
  const cleanHex = hex.replace('#', '')
  const r = parseInt(cleanHex.substr(0, 2), 16)
  const g = parseInt(cleanHex.substr(2, 2), 16)
  const b = parseInt(cleanHex.substr(4, 2), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
