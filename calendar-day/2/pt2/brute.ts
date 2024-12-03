import { createReadStream } from "fs";
import { createInterface } from "readline";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SAMPLING_RATIO = 1;

// a single delta between two values
function isDeltaSafe(
  values: number[],
  refSlope: number,
  idxA: number,
  idxB: number,
) {
  const delta = values[idxB] - values[idxA];
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

  return true;
}

// a full report
function reportIsSafe(values: number[]): boolean {
  // get a reference slope to see if slope changes
  const refDelta = values[1] - values[0];
  const refSlope = refDelta > 0 ? 1 : -1;

  for (let curIdx = 0; curIdx < values.length - 1; curIdx++) {
    let lookAheadIdx = curIdx + 1;

    if (!isDeltaSafe(values, refSlope, curIdx, lookAheadIdx)) {
      return false;
    }
  }

  return true;
}

function bruteForceReportIsSafe(values: number[]): boolean {
  if (reportIsSafe(values)) {
    return true;
  }

  for (let i = 0; i < values.length; i++) {
    const filteredValues = values.filter((_val, idx) => idx != i);
    if (reportIsSafe(filteredValues)) {
      return true;
    }
  }

  return false;
}

async function main() {
  let safeReports = 0;
  let totalReports = 0;

  const rs = createReadStream(path.join(__dirname, "input.txt"));
  // const rs = createReadStream(path.join(__dirname, "test-input.txt"));
  const rl = createInterface(rs);

  for await (const line of rl) {
    totalReports++;
    const report = line.split(" ").map((i) => Number.parseInt(i));
    if (bruteForceReportIsSafe(report)) {
      if (totalReports % SAMPLING_RATIO == 0) {
        console.log("safe " + JSON.stringify(report));
      }
      safeReports++;
    } else {
      if (totalReports % SAMPLING_RATIO == 0) {
        console.log("unsafe " + JSON.stringify(report));
      }
    }
  }

  console.log("Total reports = " + totalReports);
  console.log("Safe reports = " + safeReports);
}
await main();
