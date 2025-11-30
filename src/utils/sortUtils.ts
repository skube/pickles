import { extractNumericValue } from './helpers';

export type ObjectSortType = 'insertion' | 'key-asc' | 'key-desc' | 'key-smart' | 'value-asc' | 'value-desc';

export const getSortedObject = (obj: any, sortType: ObjectSortType): any => {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
        return obj;
    }

    const entries = Object.entries(obj);

    switch (sortType) {
        case 'key-asc':
            entries.sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
            break;
        case 'key-desc':
            entries.sort(([keyA], [keyB]) => keyB.localeCompare(keyA));
            break;
        case 'key-smart':
            // Smart key sort: handles numeric suffixes intelligently
            entries.sort(([keyA], [keyB]) => {
                // Extract text and numeric parts from keys
                const parseKey = (key: string) => {
                    const match = key.match(/^(.*?)(\d+)$/);
                    if (match) {
                        return { text: match[1], num: parseInt(match[2], 10) };
                    }
                    return { text: key, num: 0 };
                };

                const parsedA = parseKey(keyA);
                const parsedB = parseKey(keyB);

                // Sort by text part first
                const textCompare = parsedA.text.localeCompare(parsedB.text);
                if (textCompare !== 0) return textCompare;

                // Then by numeric part
                return parsedA.num - parsedB.num;
            });
            break;
        case 'value-asc':
            entries.sort(([, valueA], [, valueB]) => {
                const numA = extractNumericValue(valueA);
                const numB = extractNumericValue(valueB);
                if (numA !== numB) return numA - numB;
                // Fallback to string comparison if both are 0 or equal
                return String(valueA).localeCompare(String(valueB));
            });
            break;
        case 'value-desc':
            entries.sort(([, valueA], [, valueB]) => {
                const numA = extractNumericValue(valueA);
                const numB = extractNumericValue(valueB);
                if (numA !== numB) return numB - numA;
                // Fallback to string comparison if both are 0 or equal
                return String(valueB).localeCompare(String(valueA));
            });
            break;
        case 'insertion':
        default:
            // Keep original order
            break;
    }

    return Object.fromEntries(entries);
};

export const sortPrimitiveResults = (
    results: any[],
    sortConfig: { column: 'path' | 'value'; direction: 'asc' | 'desc' } | null
): any[] => {
    const sorted = [...results];

    if (sortConfig) {
        const { column, direction } = sortConfig;
        const modifier = direction === 'asc' ? 1 : -1;

        sorted.sort((a, b) => {
            if (column === 'path') {
                return a.path.localeCompare(b.path) * modifier;
            } else {
                // Value sort
                const valA = String(a.value);
                const valB = String(b.value);

                // Check if both start with a digit (for smart numeric sort)
                const isNumA = /^-?\d/.test(valA);
                const isNumB = /^-?\d/.test(valB);

                if (isNumA && isNumB) {
                    const numA = extractNumericValue(valA);
                    const numB = extractNumericValue(valB);
                    if (numA !== numB) {
                        return (numA - numB) * modifier;
                    }
                }

                return valA.localeCompare(valB) * modifier;
            }
        });
    }
    return sorted;
};
