// Convert hex color to RGB array for jsPDF (with opacity applied as lighter background)
export const hexToRgbArray = (hex, opacity = 0.2) => {
    if (!hex) return null;
    // Remove # if present
    const cleanHex = hex.replace('#', '');
    // Handle 3-digit hex
    const r = cleanHex.length === 3 
        ? parseInt(cleanHex[0] + cleanHex[0], 16)
        : parseInt(cleanHex.substring(0, 2), 16);
    const g = cleanHex.length === 3
        ? parseInt(cleanHex[1] + cleanHex[1], 16)
        : parseInt(cleanHex.substring(2, 4), 16);
    const b = cleanHex.length === 3
        ? parseInt(cleanHex[2] + cleanHex[2], 16)
        : parseInt(cleanHex.substring(4, 6), 16);
    // Blend with white background (255, 255, 255) based on opacity
    // Formula: result = (color * opacity) + (white * (1 - opacity))
    const blendedR = Math.round(r * opacity + 255 * (1 - opacity));
    const blendedG = Math.round(g * opacity + 255 * (1 - opacity));
    const blendedB = Math.round(b * opacity + 255 * (1 - opacity));
    return [blendedR, blendedG, blendedB];
};

// Convert hex color to rgba with opacity
export const hexToRgba = (hex, opacity = 0.2) => {
    if (!hex) return undefined;
    // Remove # if present
    const cleanHex = hex.replace('#', '');
    // Handle 3-digit hex
    const r = cleanHex.length === 3 
        ? parseInt(cleanHex[0] + cleanHex[0], 16)
        : parseInt(cleanHex.substring(0, 2), 16);
    const g = cleanHex.length === 3
        ? parseInt(cleanHex[1] + cleanHex[1], 16)
        : parseInt(cleanHex.substring(2, 4), 16);
    const b = cleanHex.length === 3
        ? parseInt(cleanHex[2] + cleanHex[2], 16)
        : parseInt(cleanHex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

