import { createReadStream } from "fs";
import { createInterface } from "readline";

const rs = createReadStream("input.txt");
const rl = createInterface(rs);

const listA: number[] = [];
const listB: number[] = [];

for await (const line of rl) {
  const [locA, locB] = line.split("   ");
  listA.push(Number.parseInt(locA));
  listB.push(Number.parseInt(locB));
}

listA.sort();
listB.sort();

let totalDistance = 0;
for (let i = 0; i < listA.length; i++) {
  const distance = listA[i] - listB[i];
  totalDistance += distance > 0 ? distance : -1 * distance;
}

console.log("Number of points = " + listA.length);
console.log("Total distance = " + totalDistance);
