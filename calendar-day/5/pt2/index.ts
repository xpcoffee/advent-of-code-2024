import { createReadStream } from "fs";
import { createInterface } from "readline";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const verbose = true;

// read input
const rs = createReadStream(path.join(__dirname, "input.txt"));
// const rs = createReadStream(path.join(__dirname, "input-minimal.txt"));
const rl = createInterface(rs);

type Rule = { before: number; after: number };
type Update = number[];
type RuleMap = Record<number, number[]>;

async function readInstructions(): Promise<[Rule[], Update[]]> {
  const rules: Rule[] = [];
  const updates: Update[] = [];

  let parsingRules = true;
  let i = 0;
  for await (const line of rl) {
    if (line.length === 0) {
      parsingRules = false;
      continue;
    }

    if (parsingRules) {
      const [before, after] = line.split("|");
      rules.push({
        before: Number.parseInt(before),
        after: Number.parseInt(after),
      });
    } else {
      const update = line.split(",").map((s) => Number.parseInt(s));
      updates.push(update);
    }
    i++;
  }

  return [rules, updates];
}

function mapRules(rules: Rule[]): RuleMap {
  const ruleMap: RuleMap = {};

  for (let rule of rules) {
    if (!ruleMap[rule.before]) {
      ruleMap[rule.before] = [rule.after];
    } else {
      ruleMap[rule.before].push(rule.after);
    }
  }

  return ruleMap;
}

function orderingIsCorrect(ruleMap: RuleMap, update: Update): boolean {
  for (let i = 0; i < update.length; i++) {
    const currentVal = update[i];
    const afterValues = ruleMap[currentVal];
    if (!afterValues) {
      continue;
    }

    // check values before i should not be after i
    for (let j = 0; j < i; j++) {
      if (afterValues.includes(update[j])) {
        return false;
      }
    }
  }

  return true;
}

function getMedian(values: number[]): number {
  const medianIndex = (values.length - 1) / 2;
  return values[medianIndex];
}

function orderUpdate(ruleMap: RuleMap, update: Update): Update {
  return update.sort((a, b) => {
    if (ruleMap[b] !== undefined && ruleMap[b].includes(a)) {
      return 1;
    }

    if (ruleMap[a] !== undefined && ruleMap[a].includes(b)) {
      return -1;
    }

    return 0;
  });
}

async function main() {
  const [rules, updates] = await readInstructions();
  if (verbose) {
    for (let rule of rules) {
      console.log(`rule ${rule.before} ${rule.after}`);
    }
    for (let update of updates) {
      console.log(`update ${JSON.stringify(update)}`);
    }
  }

  const ruleMap = mapRules(rules);
  const incorrectUpdates = updates.filter(
    (update) => !orderingIsCorrect(ruleMap, update),
  );
  const finalValue = incorrectUpdates
    .map((update) => orderUpdate(ruleMap, update))
    .map(getMedian)
    .reduce((total, val) => total + val, 0);
  console.log(finalValue);
}
main();
