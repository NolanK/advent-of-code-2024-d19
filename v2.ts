import { 
    TowelPosition, 
    Combination, 
    CombinationSet, 
    Cache, 
    cacheKeyForCombination, 
    cacheKeyForCombinationSet
} from "./types";


// - trying to exit early if the combination length is less than the design length
// - still too slow but realizing that setting all the children in the above case is also very slow....
// - figure out way to set the children recursively in a more quicker way... bottom up?
// - trying bottom up approach but it's still too slow...
//   - bottm up requires different exit condition (overlap vs length of combination)
// - bottom up also requires combination sets to dedup towel positions, along with consistent ordering for cache keys
// - tried reordering how we populate the cache and when we check for valid design, still no luck
// - tried different ordering techniques of the initial available towel positions
// - tried ordering of bottom up and top down differently (ie. from the back or front, etc.), no luck
export function getValidDesignsV2(availableTowels: string[], designs: string[]): string[] {
    console.log("[v2]: Running getValidDesigns ...");

    const validDesigns: string[] = [];

    for (const design of designs) {
        if (isDesignValid(design, availableTowels)) {
            validDesigns.push(design);
        }
    }

    return validDesigns;
}

function isDesignValid(design: string, availableTowels: string[]): boolean {

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
    // availableTowelPositions.sort((a, b) => b.towel.length - a.towel.length); // largest to smallest
    // availableTowelPositions.sort((a, b) => a.towel.length - b.towel.length); // smallest to largest
    // availableTowelPositions.sort((a, b) => b.position - a.position); // largest to smallest
    // availableTowelPositions.sort((a, b) => a.position - b.position); // smallest to largest
    availableTowelPositions.sort((a, b) => (a.position - b.position) || (b.towel.length - a.towel.length)); // smallest to largest by position, then largest to smallest by length

    // // Remove all single character towels for now...
    // availableTowelPositions = availableTowelPositions.filter(t => t.towel.length > 2);


    // With all the possible towel positions for this design,
    // we now iterate through each possible combination of towel positions to
    // see if any make up the full design with no overlapping towels.
    // If there is at least one combination of towels that make up the full design, then its valid. 
    // There are alot of combinations (too many), but this is a DP problem so we can cache combinations that we've already tried.
    const cache: Cache = {
        cache: new Map<string, boolean>(),  
        hit: 0,
        miss: 0,
    };

    // console.log("DESIGN:", design);
    // console.log(`AVAILABLE TOWEL POSITIONS:`, availableTowelPositions, `[${availableTowelPositions.length}]`);

    const startTime = performance.now();
    // const result = tryCombinationTopDown(availableTowelPositions, design, cache);
    const result = tryCombinationBottomUp(new Set(), -1, availableTowelPositions, design, cache);
    const endTime = performance.now();

    console.log(`DESIGN: ${design}, TOWELS: ${availableTowelPositions.length}, RES: ${result} [${(endTime - startTime).toFixed(2)}ms], CACHE: ${cache.hit} hits, ${cache.miss} misses`);
    return result;
}

function tryCombinationBottomUp(combination: CombinationSet, currentPosition: number, availableTowelPositions: TowelPosition[], design: string, cache: Cache): boolean {

    if (cache.cache.has(cacheKeyForCombinationSet(combination))) {
        cache.hit++;
        return false;
    }

    // if this combination has any overlap, then adding any additional towel positions will also have overlap so we can exity early.
    if (getTowelPositions(combination).some(value => value > 1)) {
        return false;
    }

    if (isCombinationValid(combination, design, cache)) {
        return true;
    }

    cache.miss++;
    cache.cache.set(cacheKeyForCombinationSet(combination), false);

    for (let i = (currentPosition + 1); i < availableTowelPositions.length; i++) {
            
        let newCombination: CombinationSet = new Set([...combination, availableTowelPositions[i]]);
        
        if (tryCombinationBottomUp(newCombination, i, availableTowelPositions, design, cache)) {
            return true;
        }
    }

    return false;
}


function tryCombinationTopDown(combination: Combination, design: string, cache: Cache): boolean {

    if (cache.cache.has(cacheKeyForCombination(combination))) {
        cache.hit++;
        return false;
    }

    // If the combination doesn't cover the entire design, we can exit early
    // and bypass all the children checks because no sub-combinations will be valid.
    if (getTowelPositions(combination).filter(p => p > 0).length < design.length) {
        return false;
    }

    if (isCombinationValid(combination, design, cache)) {
        return true;
    }

    cache.miss++;
    cache.cache.set(cacheKeyForCombination(combination), false);
    
    // Try all combinations of length i - 1
    for (let i = combination.length - 1; i >= 0; i--) {
        
        let newCombination: Combination = [...combination];
        newCombination.splice(i, 1);
        
        if (tryCombinationTopDown(newCombination, design, cache)) {
            return true;
        }
    }

    return false;
}

function getTowelPositions(combination: CombinationSet | Combination): number[] {
    let positions: number[] = [];
    
    for (const towelPosition of combination) {
        for (let i = towelPosition.position; i < towelPosition.position + towelPosition.towel.length; i++) {
            positions[i] = (positions[i] || 0) + 1;
        }
    }

    return positions;
}

// The combination of towel positions is valid if every character in the design is
// covered by a character of a towel position *exactly once*. 
function isCombinationValid(combination: Combination | CombinationSet, design: string, cache: Cache): boolean {

    for (let i = 0; i < design.length; i++) {
        let characterCoveredCount = 0;

        for (const towelPosition of combination) {
            
            for (let j = towelPosition.position; j < towelPosition.position + towelPosition.towel.length; j++) {

                if (j === i) {
                    characterCoveredCount++;
                }
            }
        }

        if (characterCoveredCount !== 1) {
            return false;
        }
    }

    return true;
}


