import { 
    TowelPosition, 
    Combination, 
    CombinationIndicies, 
    CombinationSet, 
    CacheSet as Cache, 
    Cache as CacheMap,
    CombinationIndicesSet,
    cacheKeyForCombinationSet,
    cacheKeyForCombinationIndicies,
} from "./types";


// - attempt to count all valid designs instead of exiting on first one... back to being too slow again...
// - realizing that our current caching does absolutely nothing for the bottom up approach
//   - a new caching technique/state for bottom up would probably solve the DP problem properly
export function getValidDesignsV5(availableTowels: string[], designs: string[]): string[] {
    console.log("[v5]: Running getValidDesigns ...");

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

    // With all the possible towel positions for this design,
    // we now iterate through each possible combination of towel positions to
    // see if any make up the full design with no overlapping towels.
    // If there is at least one combination of towels that make up the full design, then its valid. 
    // There are alot of combinations (too many), but this is a DP problem so we can cache combinations that we've already tried.
    const cache: Cache = new Set<bigint>();
    const validDesignCount: { count: number } = { count: 0 };

    // console.log("DESIGN:", design);
    // console.log(`AVAILABLE TOWEL POSITIONS:`, availableTowelPositions, `[${availableTowelPositions.length}]`);
    
    const startTime = performance.now();
    tryCombinationBottomUp(new Set(), -1, availableTowelPositions, design, cache, validDesignCount);
    const endTime = performance.now();

    console.log(`DESIGN: ${design}, TOWELS: ${availableTowelPositions.length}, VALID_COMBINATIONS: ${validDesignCount.count} [${(endTime - startTime).toFixed(2)}ms]`);

    return validDesignCount.count;
}

function tryCombinationBottomUp(combination: CombinationIndicesSet, currentPosition: number, availableTowelPositions: TowelPosition[], design: string, cache: Cache, validDesignCount: { count: number }): boolean {

    if (cache.has(cacheKeyForCombinationIndicies(combination))) {
        return false;
    }

    let foundAny = false;

    for (let i = (currentPosition + 1); i < availableTowelPositions.length; i++) {

        let newCombination: CombinationIndicesSet = new Set([...combination, i]);
        
        const newCombinationKey = cacheKeyForCombinationIndicies(newCombination);
        const newTowelPositions = getTowelPositionsFromIndicies(newCombination, availableTowelPositions);
        
        // if the new combination has any overlap,
        // then adding any additional towel positions will also have overlap so we can exit early.
        if (newTowelPositions.some(value => value > 1)) {
            cache.add(newCombinationKey);
            continue;
        }

        // if the new combination covers the entire design, then it is valid
        if (newTowelPositions.filter(p => p > 0).length === design.length) {
            validDesignCount.count++;
            
            foundAny = true;
            continue;
        }

        // Since availableTowelPositions is sorted by position,
        // we can exit early if the first gap is found and the next towel
        // position is after the gap since we know that no further combinations can fill that gap. 
        const firstGap = newTowelPositions.findIndex(p => p === 0);
        const firstUncovered = firstGap === -1 ? newTowelPositions.length : firstGap;
        const nextTowelPosition = availableTowelPositions[i + 1]?.position ?? Infinity;
        
        if (nextTowelPosition > firstUncovered) {
            // invalid, this current combination has a gap that will never be covered by any additional towel positions
            cache.add(newCombinationKey);
            break;
        }

        if (tryCombinationBottomUp(newCombination, i, availableTowelPositions, design, cache, validDesignCount)) {
            foundAny = true;
            
            // NOTE: We shouldn't be returning here because we want to find all valid combinations, but
            // due to a non-complete solution (caching is incorrect), we return just so we can finish the run. 
            return true;
        }
    }

    return foundAny;
}


function getTowelPositionsFromIndicies(combination: CombinationIndicies | CombinationIndicesSet, availableTowelPositions: TowelPosition[]): number[] {
    let positions: number[] = [];
    
    for (const index of combination) {
        const towelPosition = availableTowelPositions[index];

        for (let i = towelPosition.position; i < towelPosition.position + towelPosition.towel.length; i++) {
            positions[i] = (positions[i] || 0) + 1;
        }
    }

    // Fill in any gaps with 0s
    for (let i = 0; i < positions.length; i++) {
        if (positions[i] === undefined) {
            positions[i] = 0;
        }
    }

    return positions;
}


