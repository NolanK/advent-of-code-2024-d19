import { 
    TowelPosition, 
    Combination, 
    CombinationIndicies, 
    CombinationSet, 
    CacheSet as Cache, 
    cacheKeyForCombination, 
    CombinationIndicesSet,
    cacheKeyForCombinationSet,
    cacheKeyForCombinationIndicies,
} from "./types";


// - try breadth-first for the bottom up approach, cancelling out all small overlapping pairs early
// - try more efficient caching with bit masking
// - realizing cache space is too large... will probably need to break the problem down differently...
export function getValidDesignsV3(availableTowels: string[], designs: string[]): string[] {
    console.log("[v3]: Running getValidDesigns ...");

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
    availableTowelPositions = availableTowelPositions.filter(t => t.towel.length > 2);


    // With all the possible towel positions for this design,
    // we now iterate through each possible combination of towel positions to
    // see if any make up the full design with no overlapping towels.
    // If there is at least one combination of towels that make up the full design, then its valid. 
    // There are alot of combinations (too many), but this is a DP problem so we can cache combinations that we've already tried.
    const cache: Cache = new Set<bigint>();

    // console.log("DESIGN:", design);
    // console.log(`AVAILABLE TOWEL POSITIONS:`, availableTowelPositions, `[${availableTowelPositions.length}]`);

    const startingCombination: CombinationIndicies = availableTowelPositions.map((_, ix) => ix);

    const startTime = performance.now();
    // const result = tryCombinationTopDown(startingCombination, design, cache, availableTowelPositions);
    const result = tryCombinationBottomUp(new Set(), -1, availableTowelPositions, design, cache);
    const endTime = performance.now();

    console.log(`DESIGN: ${design}, TOWELS: ${availableTowelPositions.length}, RES: ${result} [${(endTime - startTime).toFixed(2)}ms]`);
    return result;
}

function tryCombinationBottomUp(combination: CombinationIndicesSet, currentPosition: number, availableTowelPositions: TowelPosition[], design: string, cache: Cache): boolean {

    const cacheKey = cacheKeyForCombinationIndicies(combination);

    if (cache.has(cacheKey)) {
        return false;
    }
    
    cache.add(cacheKey);

    const towelPositions = getTowelPositionsFromIndicies(combination, availableTowelPositions).filter(p => p > 0);

    // if this combination has any overlap,
    // then adding any additional towel positions will also have overlap so we can exity early.
    if (towelPositions.some(value => value > 1)) {
        return false;
    }

    if (towelPositions.length === design.length) {
        // combination is valid
        return true;
    }

    // Get a list of new combinations with one additional towel position (breadth-first)
    let newCombinations: [CombinationIndicesSet, number][] = [];

    // for (let i = availableTowelPositions.length - 1; i > currentPosition; i--) {
    for (let i = (currentPosition + 1); i < availableTowelPositions.length; i++) {
            
        let newCombination: [CombinationIndicesSet, number] = [new Set([...combination, i]), i];
        
        const newTowelPositions = getTowelPositionsFromIndicies(newCombination[0], availableTowelPositions).filter(p => p > 0);
        
        // if the new combination has any overlap,
        // then adding any additional towel positions will also have overlap so we can exity early.
        if (newTowelPositions.some(value => value > 1)) {
            cache.add(cacheKeyForCombinationIndicies(newCombination[0]));
            continue;
        }
        
        if (newTowelPositions.length === design.length) {
            // combination is valid
            return true;
        }

        newCombinations.push(newCombination);
    }

    // Now iterate through all the new combinations
    for (const [newCombination, i] of newCombinations) {
            
        if (tryCombinationBottomUp(newCombination, i, availableTowelPositions, design, cache)) {
            return true;
        }   
    }

    return false;
}


function tryCombinationTopDown(combination: CombinationIndicies, design: string, cache: Cache, availableTowelPositions: TowelPosition[]): boolean {

    const cacheKey = cacheKeyForCombinationIndicies(combination);

    if (cache.has(cacheKey)) {
        return false;
    }

    cache.add(cacheKey);

    const towelPositions = getTowelPositionsFromIndicies(combination, availableTowelPositions).filter(p => p > 0);

    // If the combination doesn't cover the entire design, we can exit early
    // and bypass all the children checks because no sub-combinations will be valid.
    if (towelPositions.length < design.length) {
        return false;
    }
    
    // Try all combinations of length i - 1
    for (let i = combination.length - 1; i >= 0; i--) {
        
        let newCombination: CombinationIndicies = [...combination];
        newCombination.splice(i, 1);
        
        if (tryCombinationTopDown(newCombination, design, cache, availableTowelPositions)) {
            return true;
        }
    }

    // If there are overlapping towel positions, this combination is also invalid.
    if (towelPositions.some(p => p > 1)) {
        return false;
    }

    // valid!
    return true;
}

function getTowelPositionsFromIndicies(combination: CombinationIndicies | CombinationIndicesSet, availableTowelPositions: TowelPosition[]): number[] {
    let positions: number[] = [];
    
    for (const index of combination) {
        const towelPosition = availableTowelPositions[index];

        for (let i = towelPosition.position; i < towelPosition.position + towelPosition.towel.length; i++) {
            positions[i] = (positions[i] || 0) + 1;
        }
    }

    return positions;
}


