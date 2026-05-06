import { 
    TowelPosition,
} from "./types";


// - A new approach where we flip what we're caching from "tried invalid combinations" to
// "number of valid towel combinations from design position n"
export function getValidDesignsV6(availableTowels: string[], designs: string[]): string[] {
    console.log("[v6]: Running getValidDesigns ...");

    const validDesigns: string[] = [];

    let totalDesignVariations = 0;

    for (const design of designs) {
        
        const validDesignCount = isDesignValid(design, availableTowels);
        if (validDesignCount > 0) {
            validDesigns.push(design);
            totalDesignVariations += validDesignCount;
        }
    }

    console.log(`TOTAL DESIGN VARIATIONS: ${totalDesignVariations}`);

    return validDesigns;
}

function isDesignValid(design: string, availableTowels: string[]): number {

    // First get all the available towels (and their positions) that fit into the design,
    // since any towel can be used potentially many times in a design.
    // Note that there maybe overlapping towel positions within the design.
    // E.g. "rr" can fit into the design "rrrr" at positions 0, 1 and 2,
    // with positions [0,1] overlapping, and positions [1,2] overlapping.
    let availableTowelPositions: TowelPosition[] = [];

    for (const towel of availableTowels) {
        for (let i = 0; i < design.length; i++) {
            
            if (i + towel.length > design.length) {
                continue;
            }

            if (design.slice(i, i + towel.length) === towel) {
                availableTowelPositions.push({ towel, position: i });
            }
        }
    }

    // order the towels by size
    availableTowelPositions.sort((a, b) => (a.position - b.position) || (a.towel.length - b.towel.length)); // smallest to largest by position, then smallest to largest by length
    
    const startTime = performance.now();
    const validDesignCombinations = validDesignCombinationsFromPosition(0, availableTowelPositions, design, new Map<number, number>());
    const endTime = performance.now();

    console.log(`DESIGN: ${design}, TOWELS: ${availableTowelPositions.length}, VALID_COMBINATIONS: ${validDesignCombinations} [${(endTime - startTime).toFixed(2)}ms]`);

    return validDesignCombinations;
}

// Recrusve through the design bottom up, counting the number
// of valid towel combinations starting at each position in the design.
function validDesignCombinationsFromPosition(
    currentDesignPosition: number, 
    availableTowelPositions: TowelPosition[], 
    design: string, 
    cache: Map<number, number>
): number {

    if (cache.has(currentDesignPosition)) {
        return cache.get(currentDesignPosition)!;
    }
    
    // If we've reached the end of the design, then no combinations can be made from here.
    if (currentDesignPosition >= design.length) {
        return 0;
    }

    // Get the towels that match the part of the design from the current design position
    const validTowels = availableTowelPositions.filter(t => {

        if (t.position !== currentDesignPosition) {
            return false;
        }

        for (let i = 0; i < t.towel.length; i++) {
            if (t.towel[i] !== design[currentDesignPosition + i]) {
                return false;
            }
        }

        return true;
    });

    // If there are no matching towels, then no combination can finish the design from here. 
    if (validTowels.length === 0) {
        cache.set(currentDesignPosition, 0);
        return 0;
    }

    let validDesignCombinations = 0;
    
    // For each valid towel at the current design position, explore all possible combinations that can be made from here.
    for (const validTowel of validTowels) {
        const newDesignPosition = currentDesignPosition + validTowel.towel.length;

        if (newDesignPosition === design.length) {
            validDesignCombinations++;
            continue;
        }

        validDesignCombinations += validDesignCombinationsFromPosition(newDesignPosition, availableTowelPositions, design, cache);
    }

    cache.set(currentDesignPosition, validDesignCombinations);
    return validDesignCombinations;
}
