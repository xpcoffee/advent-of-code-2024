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
type Direction = "NW" | "SW" | "SE" | "NE";
const directions: Direction[] = ["NE", "NW", "SE", "SW"];
const verbose = false;

function reverseDirection(direction: Direction): Direction {
  switch (direction) {
    case "NW":
      return "SE";
    case "NE":
      return "SW";
    case "SW":
      return "NE";
    case "SE":
      return "NW";
  }
}

async function readGrid(): Promise<CharacterGrid> {
  const grid: CharacterGrid = [];

  let i = 0;
  for await (const line of rl) {
    grid[i] = line.split("");
    i++;
  }

  return grid;
}

function findAs(grid: CharacterGrid): Coordinate[] {
  const xes: Coordinate[] = [];
  grid.forEach((row, y) => {
    row.forEach((char, x) => {
      if (char == "A") {
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

function evalA(grid: CharacterGrid, x: Coordinate): number {
  const chars = "MAS".split("");
  let findings = 0;

  for (let direction of directions) {
    let found = true;
    //move into position before checking diagonally
    let coord: Coordinate | null = advance(
      grid,
      x,
      reverseDirection(direction),
    );

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

  return findings === 2 ? 1 : 0; // if we find 2 MASES, we found a cross
}

function findXmases(grid: CharacterGrid, xes: Coordinate[]): number {
  return xes.reduce((total, x) => total + evalA(grid, x), 0);
}

async function main() {
  const grid = await readGrid();
  if (verbose) {
    for (let row of grid) {
      console.log(JSON.stringify(row));
    }
  }
  const xes = findAs(grid);
  const xmases = findXmases(grid, xes);
  console.log(xmases);
}
await main();
