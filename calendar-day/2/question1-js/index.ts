import { createReadStream } from "fs";
import { createInterface } from "readline";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// read input
const rs = createReadStream(path.join(__dirname, "input.txt"));
const rl = createInterface(rs);

function reportIsSafe(values: number[]): boolean {
  const refDelta = values[1] - values[0];
  const refSlope = refDelta > 0 ? 1 : -1;

  for (let i = 0; i < values.length - 1; i++) {
    // check no change
    const delta = values[i + 1] - values[i];
    if (delta === 0) {
      return false;
    }

    // check change in gradient
    if (delta * refSlope < 0) {
      return false;
    }

    // check too high change
    const absDelta = delta > 0 ? delta : -1 * delta;
    if (absDelta > 3) {
      return false;
    }
  }
  return true;
}

let safeReports = 0;
let totalReports = 0;
for await (const line of rl) {
  totalReports++;
  const report = line.split(" ").map((i) => Number.parseInt(i));
  if (reportIsSafe(report)) {
    if (totalReports % 10 == 0) {
      console.log("safe " + JSON.stringify(report));
    }
    safeReports++;
  } else {
    if (totalReports % 10 == 0) {
      console.log("unsafe " + JSON.stringify(report));
    }
  }
}

console.log("Total reports = " + totalReports);
console.log("Safe reports = " + safeReports);
