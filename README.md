# Advent of Code 2024, Day 19
Here's my attempt at this coding challenge. I was able to solve part 1 but could not complete part 2.

I realized early on that it was a DP (Dynamic Programming) problem and so I tried approaching it in that framing, using a recursive algorithm with cached results. Many iterations involved simply trying and tweaking either a top down approach (starting with all towel combinations then removing one at each iteration), or a bottom up approach (starting with no towels and adding new combinations at each iteration).

I tried caching on combinations of towels that were invalid (to allow for early exit / branch pruning), but after many trials I believe in the end that this was perhaps my downfall and is what led to the incomplete final solution (more below).

I took snapshots of my progess so I could document my thought process along the way. Below are some details about each version / snapshot with the code linked for posterity. 

Only the final / current version runs (the others hang due to time complexity), but testing the old versions are still possible by commenting out the approproriate version [here](/index.ts).



## How to Run 
You can run the latest version of my attempt by running the tyepscript / node program:

```
npm install
npm run start
```


### [Version 1](/v1.ts)
Initial attempt with a simple top down approach. Took a litte while to get familiar with the problem and how to iterate over each combination properly.
- very naive caching (caching validity of each combination)
- simple attempt at sorting the towel positions
- tried changing the order of depth first search

### [Version 2](/v2.ts)
An attempt at bottom up was made. Both versions are still too slow.
- introduced different exit conditions / branch pruning for each approach:
    - _top down:_ gaps in towel positions - no further towel removal can fill those gaps
    - _bottom up:_ overlapping towels - adding more towels won't remove those overlaps
- some reworking of caching
    - changed to combination sets to be order agnostic in bottom up
- tried different ways to order the initial towel list (just intuitive guesses at this point)
- tried different ordering of recursion for each method (from front to back or vice versa)

### [Version 3](/v3.ts)
A little stuck at this point. Not sure if there are efficiency wins we could try which would finish the algorithm in decent time. 
- tried doing breadth-first search for the bottom up approach
    - idea being to cancel out all small overlapping pairs early
- tried a more efficient caching technique using bit masking

Finally realizing that the search space is just too large and our caching isn't really working. A different approach might be needed at this point.

### [Version 4](/v4_p1_solution.ts)
Decided to read up more on factorials and combinatorics. Learned about Pascal's Triangle / Rule, and learned that this would probably be an efficient DP approach for this problem.
- tried implementing a small prototype using Pascal's Triangle, but couldn't quite get it working
- more small tweaks to how we populate the cache

#### __*Key insight for a solution to part 1*__
Realizing after a while that there is more we can do to prune / early exit in the bottom up case! We were checking for gaps in towels for the top down case, but we could also use these towels gaps in the bottom up case. **Because the towels are ordered by position in ascending order**, we could exit early if the current working towel's position was past any gap in the current combination of towels.

This early exit / pruning strategy now means the bottom up approach finishes and we get an answer!


### [Current Version](/current.ts)
Now that we have an answer to part 1. We can try part 2 which is to find *all* the valid combinations for each design. This exposed my solution to the problems and bugs that would cause part 2 to be left unfinshed.
- trying to continue the recursion instead of returning on first valid design lead to aglorithm being slow again
- discovering through debugging and testing that the caching is doing nothing in our bottom up approach. 
    - no cache hits occur, implying that what we are caching on the wrong thing for this bottom up approach.

Without an appropriate cache state, this "DP approach" provides no performance benefits and the algorithm's time complexity remains too large to finish. For the sake of completeness, we simply exit early in this final attempt just to finish the run, but the count for each valid design will be incorrect.

## Summary
This was a pretty challenging problem given my little exposure to Dynamic Programming. I iterated on it for quite some time and was able to finish part one, without realizing until part 2 that I wasn't using DP caching properly anyway and had solved part 1 using a simple recursion + branch pruning technique.

I think designing a new caching strategy would probably improve performance enough to complete part 2, but I am left unsure as to what exactly to cache on. We probably still need to use the bottom up approach, and cache on something like the "current design positions up to position n", or something related to the current position in the design. 

An optimal DP solution to this probably lies somewhere using the Pascal's Triangle rule (this seems to be a typical DP problem space after doing some research).

This was a fun problem - thank you!