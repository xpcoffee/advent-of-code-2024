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
  let refSlope: -1 | 1 | undefined;

  function getSlope(valueA: number, valueB: number) {
    const delta = valueB - valueA;
    return delta > 0 ? 1 : -1;
  }

  logv("evaluating " + JSON.stringify(values));

  let dampings = 0;

  for (let curIdx = 0; curIdx < values.length - 1; curIdx++) {
    let lookAheadIdx = curIdx + 1;

    let valueA = values[curIdx];
    let valueB = values[lookAheadIdx];

    let deltaSafe = isDeltaSafe(valueA, valueB, refSlope);
    if (deltaSafe) {
      refSlope = getSlope(valueA, valueB);
    }

    while (!deltaSafe && dampings < MAX_DAMPING) {
      dampings++;

      // reset slope if we find an issue on second value
      if (curIdx === 1) {
        refSlope = undefined;

        logv("try ignore initial slope");
        deltaSafe = isDeltaSafe(valueA, valueB, refSlope);
      }

      if (!deltaSafe) {
        logv("try skip next");
        lookAheadIdx = curIdx + 2;
        valueA = values[curIdx];
        valueB = values[lookAheadIdx];

        deltaSafe = isDeltaSafe(valueA, valueB, refSlope);
      }

      if (!deltaSafe) {
        if (curIdx == 0) {
          logv("try skip current - first value edgecase");
          lookAheadIdx = curIdx + 2;
          valueA = values[curIdx + 1];
          valueB = values[lookAheadIdx];

          deltaSafe = isDeltaSafe(valueA, valueB, refSlope);
        } else {
          logv("try skip current");
          lookAheadIdx = curIdx + 1;
          valueA = values[curIdx - 1];
          valueB = values[lookAheadIdx];

          deltaSafe = isDeltaSafe(valueA, valueB, refSlope);
        }
      }

      if (deltaSafe) {
        refSlope = getSlope(valueA, valueB);
      }
    }

    if (deltaSafe) {
      curIdx = lookAheadIdx - 1;
      continue;
    }
    return false;
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
