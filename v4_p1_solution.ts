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


// - read up on pascals triangle / rule, tried a small prototype of it but couldn't quite figure it out
// - only adding to cache on invalid combinations
// - finally realizing we can prune even more in the bottom up approach... not just overlapping but also dead gaps (solely due to correct ordering of towel positions!)
// - reverting back to depth first as breadth first was alot slower (still worked though)
export function getValidDesignsV4(availableTowels: string[], designs: string[]): string[] {
    console.log("[v4]: Running getValidDesigns ...");

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

    // With all the possible towel positions for this design,
    // we now iterate through each possible combination of towel positions to
    // see if any make up the full design with no overlapping towels.
    // If there is at least one combination of towels that make up the full design, then its valid. 
    // There are alot of combinations (too many), but this is a DP problem so we can cache combinations that we've already tried.
    const cache: Cache = new Set<bigint>();
    const cache2: CacheMap = {
        cache: new Map<string, boolean>(),  
        hit: 0,
        miss: 0,
    };

    // console.log("DESIGN:", design);
    // console.log(`AVAILABLE TOWEL POSITIONS:`, availableTowelPositions, `[${availableTowelPositions.length}]`);

    const startingCombination: CombinationIndicies = availableTowelPositions.map((_, ix) => ix);

    const startTime = performance.now();
    // const result = tryCombinationTopDown(startingCombination, design, cache, availableTowelPositions);
    const result = tryCombinationBottomUp(new Set(), -1, availableTowelPositions, design, cache);
    // const result = tryBinomialCoefficient(availableTowelPositions, design, cache2);
    const endTime = performance.now();

    console.log(`DESIGN: ${design}, TOWELS: ${availableTowelPositions.length}, RES: ${result} [${(endTime - startTime).toFixed(2)}ms]`);
    return result;
}


function tryCombinationBottomUp(combination: CombinationIndicesSet, currentPosition: number, availableTowelPositions: TowelPosition[], design: string, cache: Cache): boolean {

    const cacheKey = cacheKeyForCombinationIndicies(combination);

    if (cache.has(cacheKey)) {
        return false;
    }

    for (let i = (currentPosition + 1); i < availableTowelPositions.length; i++) {
            
        let newCombination: CombinationIndicesSet = new Set([...combination, i]);
        
        const newTowelPositions = getTowelPositionsFromIndicies(newCombination, availableTowelPositions);
        
        // if the new combination has any overlap,
        // then adding any additional towel positions will also have overlap so we can exit early.
        if (newTowelPositions.some(value => value > 1)) {
            cache.add(cacheKeyForCombinationIndicies(newCombination));
            continue;
        }

        if (newTowelPositions.filter(p => p > 0).length === design.length) {
            // combination is valid since all design positions are covered by towel positions exactly once. 
            return true;
        }

        // Since availableTowelPositions is sorted by position,
        // we can exit early if the first gap is found and the next towel
        // position is after the gap since we know that no further combinations will be valid.
        const firstGap = newTowelPositions.findIndex(p => p === 0);
        const firstUncovered = firstGap === -1 ? newTowelPositions.length : firstGap;
        const nextTowelPosition = availableTowelPositions[i + 1]?.position ?? Infinity;
        
        if (nextTowelPosition > firstUncovered) {
            // invalid, this current combination has a gap that will never be covered by any additional towel positions
            cache.add(cacheKeyForCombinationIndicies(newCombination));
            continue;
        }

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

    // Fill in any gaps with 0s
    for (let i = 0; i < positions.length; i++) {
        if (positions[i] === undefined) {
            positions[i] = 0;
        }
    }

    return positions;
}


// Test method for attempting to use binomial coefficient to solve the problem with Pascal's Triangle / Rule
function tryBinomialCoefficient(availableTowelPositions: TowelPosition[], design: string, cache: CacheMap) : boolean {

    const len = availableTowelPositions.length;
    const startingCombination: CombinationIndicies = availableTowelPositions.map((_, ix) => ix);

    // All combinations of available towel positions is equal to the sum of all combinations of length k where k is every possible size up to the length of available towel positions.
    for (let k = 0; k <= len; k++) {

        // If one of these permutations finds a valid combination then we're done
        if (nChooseK(startingCombination, k, cache, availableTowelPositions, design, new Set())) {
            return true;
        }
    }

    return false;
}

function nChooseK(currentCombination: CombinationIndicies, k: number, cache: CacheMap, availableTowelPositions: TowelPosition[], design: string, droppedIndices: CombinationIndicesSet): boolean {
    // We can break down this binomeial coefficient using pascal's rule:
    // [n, k] = [n-1, k-1] + [n-1, k]

    if (cache.cache.has(cacheKeyForCombination(currentCombination, k, droppedIndices))) {
        cache.hit++;
        return false;
    }

    cache.miss++;
    cache.cache.set(cacheKeyForCombination(currentCombination, k, droppedIndices), false);
    
    if (k === 0) {
        return false;
    }

    if (currentCombination.length === k) {
        // test this combination
        return false; // TEST FOR NOW
    }

    const dropped = currentCombination[0];
    const newCombination = currentCombination.slice(1);
    const newDroppedIndices = new Set([...droppedIndices, dropped]);

    return nChooseK(newCombination, k - 1, cache, availableTowelPositions, design, newDroppedIndices) || 
        nChooseK(newCombination, k, cache, availableTowelPositions, design, droppedIndices);
}

function cacheKeyForCombination(combination: CombinationIndicies, k: number, droppedIndices: CombinationIndicesSet): string {
    return `${combination.join(",")}:${k}:${cacheKeyForCombinationIndicies(droppedIndices)}`;
}


