export type TowelPosition = {
    towel: string;
    position: number;
}

export type Combination = TowelPosition[];

export type CombinationSet = Set<TowelPosition>;

export type Cache = {
    cache: Map<string, boolean>;
    hit: number;
    miss: number;
}

export type CacheSet = Set<bigint>;
export type CombinationIndicies = number[];
export type CombinationIndicesSet = Set<number>;

export function cacheKeyForTowelPosition(towelPosition: TowelPosition): string {
    return `${towelPosition.position}:${towelPosition.towel}`;
}

export function cacheKeyForCombination(combination: Combination): string {
    return combination.map(towelPosition => cacheKeyForTowelPosition(towelPosition)).join(":");
}

export function cacheKeyForCombinationSet(combinationSet: CombinationSet): string {
    return Array.from(combinationSet)
        .sort((a, b) =>
            a.position !== b.position
                ? a.position - b.position
                : a.towel.localeCompare(b.towel)
        )
        .map(towelPosition => cacheKeyForTowelPosition(towelPosition)).join(":");
}

export function cacheKeyForCombinationIndicies(combinationIndicies: CombinationIndicies | CombinationIndicesSet): bigint {
    let mask = 0n;

    for (const index of combinationIndicies) {
        mask |= 1n << BigInt(index);
    }

    return mask;
}