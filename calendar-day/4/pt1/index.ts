import { createReadStream } from "fs";
import { createInterface } from "readline";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// read input
const rs = createReadStream(path.join(__dirname, "input.txt"));
// const rs = createReadStream(path.join(__dirname, "input-minimal.txt"));
const rl = createInterface(rs);

type CharacterGrid = string[][];
type Coordinate = { x: number; y: number };
type Direction = "N" | "NW" | "W" | "SW" | "S" | "SE" | "E" | "NE";
const directions: Direction[] = ["N", "S", "E", "W", "NE", "NW", "SE", "SW"];
const verbose = false;

async function readGrid(): Promise<CharacterGrid> {
  const grid: CharacterGrid = [];

  let i = 0;
  for await (const line of rl) {
    grid[i] = line.split("");
    i++;
  }

  return grid;
}

function findXes(grid: CharacterGrid): Coordinate[] {
  const xes: Coordinate[] = [];
  grid.forEach((row, y) => {
    row.forEach((char, x) => {
      if (char == "X") {
        xes.push({ x, y });
      }
    });
  });
  return xes;
}

function advance(
  grid: CharacterGrid,
  coord: Coordinate,
  direction: Direction,
): Coordinate | null {
  switch (direction) {
    case "N":
      if (coord.y == 0) {
        return null;
      }
      return { ...coord, y: coord.y - 1 };
    case "W":
      if (coord.x == 0) {
        return null;
      }
      return { ...coord, x: coord.x - 1 };
    case "S":
      if (coord.y == grid.length - 1) {
        return null;
      }
      return { ...coord, y: coord.y + 1 };
    case "E":
      if (coord.x == grid[0].length - 1) {
        return null;
      }
      return { ...coord, x: coord.x + 1 };
    case "NW":
      if (coord.y == 0 || coord.x == 0) {
        return null;
      }
      return { x: coord.x - 1, y: coord.y - 1 };
    case "NE":
      if (coord.y == 0 || coord.x == grid[0].length - 1) {
        return null;
      }
      return { x: coord.x + 1, y: coord.y - 1 };
    case "SW":
      if (coord.y == grid.length - 1 || coord.x == 0) {
        return null;
      }
      return { x: coord.x - 1, y: coord.y + 1 };
    case "SE":
      if (coord.y == grid.length - 1 || coord.x == grid[0].length - 1) {
        return null;
      }
      return { x: coord.x + 1, y: coord.y + 1 };
  }
}

function evalX(grid: CharacterGrid, x: Coordinate): number {
  const chars = "XMAS".split("");
  let findings = 0;

  for (let direction of directions) {
    let found = true;
    let coord: Coordinate | null = x;

    for (let expected of chars) {
      if (coord == null) {
        found = false;
        verbose && console.log("nope - off map");
        break;
      }

      const actual = grid[coord.y][coord.x];
      verbose && console.log({ char: actual, coord });
      if (actual !== expected) {
        found = false;
        verbose && console.log(`nope - ${actual} is not ${expected}`);
        break;
      }
      coord = advance(grid, coord, direction);
      verbose && console.log({ direction });
    }

    if (found) {
      findings += 1;
    }
  }

  return findings;
}

function findXmases(grid: CharacterGrid, xes: Coordinate[]): number {
  return xes.reduce((total, x) => total + evalX(grid, x), 0);
}

async function main() {
  const grid = await readGrid();
  if (verbose) {
    for (let row of grid) {
      console.log(JSON.stringify(row));
    }
  }
  const xes = findXes(grid);
  const xmases = findXmases(grid, xes);
  console.log(xmases);
}
await main();
