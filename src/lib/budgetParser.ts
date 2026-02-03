/**
 * Parse budget markdown table and extract budget items
 * Expected format:
 * | Category | Item | Estimated | Actual | Status |
 * |----------|------|-----------|--------|--------|
 * | Props | Hero sword | $2,500 | - | Estimated |
 */
export function parseBudgetMarkdown(markdown: string): Array<{
    item: string;
    category: string;
    estimated: number;
    actual: number;
    status: 'Estimated' | 'Pending' | 'Paid' | 'Over-budget';
    rationale?: string;
}> {
    const budgetItems: Array<any> = [];
    
    console.log("[PARSER] Starting to parse budget markdown, length:", markdown.length);
    
    try {
        // Split into lines
        const lines = markdown.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        let inTable = false;
        let headerIndices: { [key: string]: number } = {};
        
        for (const line of lines) {
            // Skip lines that don't start with |
            if (!line.startsWith('|')) continue;
            
            // Split by | and clean up
            const cells = line.split('|')
                .map(cell => cell.trim())
                .filter(cell => cell.length > 0);
            
            // Skip separator lines (lines with just dashes and colons)
            if (cells[0].match(/^[:\-\s]+$/)) {
                console.log("[PARSER] Skipping separator line");
                continue;
            }
            
            // First table row = headers
            if (!inTable) {
                // Map headers to indices - be more flexible with header names
                cells.forEach((header, index) => {
                    const normalizedHeader = header.toLowerCase().replace(/[^a-z]/g, '');
                    headerIndices[normalizedHeader] = index;
                    
                    // Also check for common variations
                    if (header.toLowerCase().includes('est') && header.toLowerCase().includes('cost')) {
                        headerIndices['estimated'] = index;
                    }
                    if (header.toLowerCase().includes('actual')) {
                        headerIndices['actual'] = index;
                    }
                    if (header.toLowerCase().includes('category')) {
                        headerIndices['category'] = index;
                    }
                    if (header.toLowerCase().includes('item') && !header.toLowerCase().includes('budget')) {
                        headerIndices['item'] = index;
                    }
                    if (header.toLowerCase().includes('status')) {
                        headerIndices['status'] = index;
                    }
                });
                console.log("[PARSER] Headers found:", headerIndices);
                console.log("[PARSER] Raw headers:", cells);
                inTable = true;
                continue;
            }
            
            // Data rows
            if (cells.length > 0) {
                const categoryIdx = headerIndices['category'] ?? 0;
                const itemIdx = headerIndices['item'] ?? 1;
                const estimatedIdx = headerIndices['estimated'] ?? headerIndices['estcost'] ?? 2;
                const actualIdx = headerIndices['actual'] ?? 3;
                const statusIdx = headerIndices['status'] ?? 4;
                const rationaleIdx = headerIndices['rationale'] ?? headerIndices['notes'] ?? -1;
                
                console.log("[PARSER] Cell values:", cells);
                console.log("[PARSER] Column indices - category:", categoryIdx, "item:", itemIdx, "estimated:", estimatedIdx, "actual:", actualIdx, "status:", statusIdx);
                
                const item = cells[itemIdx] || 'Unknown';
                const category = cells[categoryIdx] || 'General';
                const estimatedStr = cells[estimatedIdx] || '0';
                const actualStr = cells[actualIdx] || '0';
                const statusStr = cells[statusIdx] || 'Estimated';
                const rationale = rationaleIdx >= 0 ? cells[rationaleIdx] : undefined;
                
                console.log("[PARSER] Parsing:", { item, category, estimatedStr, actualStr, statusStr });
                
                // Parse currency values (remove $, commas, etc.)
                const parseAmount = (str: string): number => {
                    const cleaned = str.replace(/[\$,\s]/g, '');
                    // If it's a dash or empty, return 0
                    if (cleaned === '-' || cleaned === '' || cleaned.toLowerCase() === 'tbd') {
                        return 0;
                    }
                    const parsed = parseFloat(cleaned);
                    return isNaN(parsed) ? 0 : parsed;
                };
                
                const estimated = parseAmount(estimatedStr);
                // For actual, only parse if status is Paid or if there's a real value
                const actual = (statusStr.toLowerCase().includes('paid') || actualStr.includes('$')) 
                    ? parseAmount(actualStr) 
                    : 0;
                
                // Normalize status
                let status: 'Estimated' | 'Pending' | 'Paid' | 'Over-budget' = 'Estimated';
                const statusLower = statusStr.toLowerCase();
                if (statusLower.includes('paid')) status = 'Paid';
                else if (statusLower.includes('pending')) status = 'Pending';
                else if (statusLower.includes('over')) status = 'Over-budget';
                
                budgetItems.push({
                    item,
                    category,
                    estimated,
                    actual,
                    status,
                    rationale
                });
                
                console.log("[PARSER] Parsed item:", { item, category, estimated, status });
            }
        }
    } catch (error) {
        console.error("[PARSER] Error parsing budget markdown:", error);
    }
    
    console.log("[PARSER] Parsing complete, found", budgetItems.length, "items");
    return budgetItems;
}
