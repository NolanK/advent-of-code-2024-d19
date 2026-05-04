import { TowelPosition, Combination, Cache, cacheKeyForCombination } from "./types";


// - Initial attempt with DP caching
// - took a bit to figure out how to iterate over every combination
// - trying every combination of towel positions with no early exits
// - runs forever
// - tried sorting towel positions by size to see if a match is found sooner (no luck)
// - tried changing order of depth first search as well, diving first towards the beginning of the sorted list (no luck)
// - experiments cutting off the shortest towels to see if there are any hints around how the length of towels affects things
// - Next: could try ordering by overlap counts, etc.
export function getValidDesignsV1(availableTowels: string[], designs: string[]): string[] {
    console.log("[v1]: Running getValidDesigns ...");

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
    availableTowelPositions.sort((a, b) => b.towel.length - a.towel.length);

    // Testing remove all single character towels for now to see if we can finish...
    // availableTowelPositions = availableTowelPositions.filter(t => t.towel.length > 1);

    // console.log("DESIGN:", design);
    // console.log("AVAILABLE TOWEL POSITIONS:", availableTowelPositions);


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
    return tryCombination(availableTowelPositions, design, cache);
}


function tryCombination(combination: Combination, design: string, cache: Cache): boolean {

    if (cache.cache.has(cacheKeyForCombination(combination))) {
        // console.log('CACHE','hit', ++cache.hit, 'miss', cache.miss);
        return cache.cache.get(cacheKeyForCombination(combination))!;
    }
    
    // Try all combinations of length i - 1
    for (let i = combination.length - 1; i >= 0; i--) {
        
        let newCombination: Combination = [...combination];
        newCombination.splice(i, 1);
        
        if (tryCombination(newCombination, design, cache)) {
            return true;
        }
    }

    if (isCombinationValid(combination, design, cache)) {
        return true;
    }

    return false;
}



// The combination of towel positions is valid if every character in the design is
// covered by a character of a towel position *exactly once*. 
function isCombinationValid(combination: Combination, design: string, cache: Cache): boolean {
    // console.log('CACHE','hit', cache.hit, 'miss', ++cache.miss);

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
            cache.cache.set(cacheKeyForCombination(combination), false);
            return false;
        }
    }

    cache.cache.set(cacheKeyForCombination(combination), true);
    return true;
}


