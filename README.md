# [Advent of Code 2024, Day 19](https://adventofcode.com/2024/day/19)
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


### [Version 5](/v5.ts)
Now that we have an answer to part 1. We can try part 2 which is to find *all* the valid combinations for each design. This exposed my solution to the problems and bugs that would cause part 2 to be left unfinshed.
- trying to continue the recursion instead of returning on first valid design lead to aglorithm being slow again
- discovering through debugging and testing that the caching is doing nothing in our bottom up approach. 
    - no cache hits occur, implying that what we are caching on the wrong thing for this bottom up approach.

Without an appropriate cache state, this "DP approach" provides no performance benefits and the algorithm's time complexity remains too large to finish. For the sake of completeness, we simply exit early in this final attempt just to finish the run, but the count for each valid design will be incorrect.

### [Final Version](/current.ts)
After thinking more about the problem, I thought of a better way to cache the values. Instead of caching the state of "invalid combinations that have been attempted", we can flip it and cache the "number of design combinations that are valid from this point in the design". Doing this led to an algorithm which finished quickly and provided the correct answer for part 2. 

## Summary
I was able to find the solution to both parts 1 and 2 after changing my approach on what to cache on for the DP algorithm to work properly. I was focused before on trying to recurse through the ordered list of possible towels, instead of recursing through the design itself and keeping track of the index into the design. In the end this lead to a far simpler implementation and got to the correct solution fairly quickly. 

This was a fun problem - thank you!
