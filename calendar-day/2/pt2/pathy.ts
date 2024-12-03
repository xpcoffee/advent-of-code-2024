import { createReadStream } from "fs";
import { createInterface } from "readline";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SAMPLING_RATIO = 1;
const MAX_DAMPING = 1;
const INPUT_FILE = "input-mistakes.txt";
const VERBOSE = true;

// problem - we're only considering two values at a time when doing slope; this requires at least 3
//
// [8,9,8,5,2]
// [66,68,67,68,70]

function logv(msg: string) {
  if (VERBOSE) {
    console.log(msg);
  }
}

// for each
//  current
//    determine next
//      if safe, step to next
//      if unsafe, pick another next
//        if unsafe again
//
//
//
//     -> pick current + 1
//       -> is safe?
//         -> no = pick current +2
//         ->      note error
//         -> yes = current = next
//
//

// a single delta between two values
function isDeltaSafe(valueA: number, valueB: number, refSlope?: -1 | 1) {
  const delta = valueB - valueA;

  if (delta === 0) {
    logv(`unsafe ${valueA} - ${valueB} no change`);
    return false;
  }

  // check change in gradient
  if (refSlope === undefined) {
    logv("skipping slope check - should only happen for first two values");
  } else if (delta * refSlope < 0) {
    logv(`unsafe ${valueA} - ${valueB} slope`);
    return false;
  }

  // check too high change
  const absDelta = delta > 0 ? delta : -1 * delta;
  if (absDelta > 3) {
    logv(`unsafe ${valueA} - ${valueB} delta too high`);
    return false;
  }

  logv(`safe ${valueA} - ${valueB}`);
  return true;
}

// a full report
function reportIsSafe(values: number[]): boolean {
  let errorBudget = 1;
  let refSlope: -1 | 1 | undefined = undefined;

  for (let idx = 0; idx < values.length - 2; idx++) {
    let lookAheadIdx = idx + 1;
    var lookAheadErrors = 0;

    while (
      errorBudget > 0 &&
      !isDeltaSafe(values[idx], values[lookAheadIdx], refSlope)
    ) {
      if (lookAheadErrors < errorBudget) {
        lookAheadIdx++;
        lookAheadErrors++;
      } else {
        idx++;
        errorBudget--;
        lookAheadErrors = 0;
      }
    }

    errorBudget -= lookAheadErrors;

    if (errorBudget < 0) {
      return false;
    }
  }

  return true;
}

async function main() {
  let safeReports = 0;
  let totalReports = 0;

  const rs = createReadStream(path.join(__dirname, INPUT_FILE));
  // const rs = createReadStream(path.join(__dirname, "test-input.txt"));
  const rl = createInterface(rs);

  for await (const line of rl) {
    totalReports++;
    const report = line.split(" ").map((i) => Number.parseInt(i));
    if (reportIsSafe(report)) {
      if (totalReports % SAMPLING_RATIO == 0) {
        console.log("safe " + JSON.stringify(report));
      }
      safeReports++;
    } else {
      if (totalReports % SAMPLING_RATIO == 0) {
        console.log("unsafe " + JSON.stringify(report));
      }
    }
    console.log("");
  }

  console.log("Total reports = " + totalReports);
  console.log("Safe reports = " + safeReports);
}
await main();
