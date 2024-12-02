import { createReadStream } from "fs";
import { createInterface } from "readline";

// read input
const rs = createReadStream("input.txt");
const rl = createInterface(rs);

const listA: number[] = [];
const listB: number[] = [];

for await (const line of rl) {
  const [locA, locB] = line.split("   ");
  listA.push(Number.parseInt(locA));
  listB.push(Number.parseInt(locB));
}

// find duplicates in map B
listB.sort();
let duplicateMap = {};
for (let i = 0; i < listB.length; i++) {
  const value = listB[i];
  if (duplicateMap[value] == undefined) {
    duplicateMap[value] = 1;
  } else {
    duplicateMap[value]++;
  }
}

// calc the score
let similarityScore = 0;
for (let i = 0; i < listA.length; i++) {
  const value = listA[i];
  similarityScore += value * (duplicateMap[value] ?? 0);
}

console.log("Number of points = " + listA.length);
console.log("Similarity score = " + similarityScore);
