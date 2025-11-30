import { JsonItem } from "../types";

export const HEX_REGEX = /^#(?:[A-Fa-f0-9]{3}){1,2}$/;

export const flattenJSON = (data: any, parent = ""): JsonItem[] => {
    let result: JsonItem[] = [];
    if (typeof data === "object" && data !== null) {
        Object.entries(data).forEach(([key, value]) => {
            const path = parent ? `${parent}.${key}` : key;
            result.push({ path, value });
            result = result.concat(flattenJSON(value, path));
        });
    }
    return result;
};

// Helper to extract numeric value from strings like "8px", "16px", "1.5rem", etc.
export const extractNumericValue = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string') return 0;
    const match = value.match(/^(-?\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 0;
};
