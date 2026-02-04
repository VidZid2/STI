/**
 * Utility functions for InputScoresModal
 */

/**
 * Parse CSV text into 2D array
 * Handles quoted fields with commas
 */
export const parseCSV = (text: string): string[][] => {
    const lines = text.trim().split(/\r?\n/);
    return lines.map(line => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    });
};
