import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// first attempt = 175615763

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buffer = fs.readFileSync(path.join(__dirname, "input.txt"));
const contents = buffer.toString("utf8");

// const results = /mul\([0-9]{1,3},[0-9]{1,3}\)/g.exec(contents);
let match: RegExpExecArray | null;
let re = /mul\([0-9]{1,3},[0-9]{1,3}\)/g;
let total = 0;
while ((match = re.exec(contents))) {
  const str = match.toString();
  const [lhs, rhs] = str.substring(4, str.length - 1).split(",");
  const lhsNum = Number.parseInt(lhs);
  const rhsNum = Number.parseInt(rhs);
  total += lhsNum * rhsNum;

  console.log({ type: "multiply", lhs: lhsNum, rhs: rhsNum });
}

console.log(total);
