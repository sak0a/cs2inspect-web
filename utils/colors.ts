export const hexToRgba = (hex: string, alpha: string): string => {
    hex = hex.replace(/^#/, '');

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const a = hex.length === 8 ? parseInt(hex.substring(6, 8), 16) / 255 : alpha ? parseFloat(alpha) : 1;

    return `rgba(${r}, ${g}, ${b}, ${a})`;
};

