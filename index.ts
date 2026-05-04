import fs from "fs";
// import { getValidDesignsV1 as getValidDesigns } from "./v1";
// import { getValidDesignsV2 as getValidDesigns } from "./v2";
// import { getValidDesignsV3 as getValidDesigns } from "./v3";
// import { getValidDesignsV4 as getValidDesigns } from "./v4_p1_solution";
import { getValidDesignsV5 as getValidDesigns } from "./current";

// load input
const input = fs.readFileSync("input.txt", "utf8");

const inputSplit = input.split("\n");


if (inputSplit.length < 3 || inputSplit[1].trim().length !== 0) {
    throw new Error("Invalid input");
}

const availableTowels = inputSplit.shift()!.split(",").map(s => s.trim());

inputSplit.shift();

const designs = inputSplit;

// console.log("[AVAILABLE TOWELS]:", availableTowels);
// console.log("[DESIGNS]:", designs);

const startTime = performance.now();
const result = getValidDesigns(availableTowels, designs);
const endTime = performance.now();

console.log(`VALID DESIGNS: ${result.length} / ${designs.length} [${(endTime - startTime).toFixed(2)}ms]`);



