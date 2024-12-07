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

type Coordinate = { x: number; y: number };
type Direction = "up" | "down" | "left" | "right";
type GuardState = { position: Coordinate; direction: Direction };
type Square = { type: "obstacle" } | { type: "empty" };
type Map = Square[][];

async function readMap(): Promise<[Map, GuardState]> {
  let map: Map = [];
  let guardState: GuardState | undefined = undefined;
  let y = 0;

  for await (const line of rl) {
    const blocks = line.split("");
    let x = 0;
    const row: Square[] = blocks.map((b) => {
      const guardPos = x;
      x++;
      switch (b) {
        case ".":
          return { type: "empty" };
        case "#":
          return { type: "obstacle" };
        case "^":
          guardState = { direction: "up", position: { x: guardPos, y } };
          return { type: "empty" };
        default:
          throw "Unexpected char " + b;
      }
    });

    map.push(row);
    y++;
  }

  if (guardState === undefined) {
    throw "guard not found";
  }

  return [map, guardState];
}

function renderState(map: Map, guard: GuardState) {
  for (let y = 0; y < map.length; y++) {
    const row: string[] = [];
    for (let x = 0; x < map[0].length; x++) {
      if (guard.position.x === x && guard.position.y === y) {
        switch (guard.direction) {
          case "up":
            row.push("^");
            break;
          case "right":
            row.push(">");
            break;
          case "down":
            row.push("v");
            break;
          case "left":
            row.push("<");
            break;
        }
        continue;
      }

      switch (map[y][x].type) {
        case "obstacle":
          row.push("#");
          break;
        case "empty":
          row.push("_");
          break;
      }
    }

    console.log(row.join(""));
  }
}

function stateValid(map: Map, position: Coordinate): boolean {
  return (
    position.x >= 0 &&
    position.x < map[0].length &&
    position.y >= 0 &&
    position.y < map.length
  );
}

function nextPosition(guard: GuardState): Coordinate {
  switch (guard.direction) {
    case "up":
      return { ...guard.position, y: guard.position.y - 1 };
    case "right":
      return { ...guard.position, x: guard.position.x + 1 };
    case "down":
      return { ...guard.position, y: guard.position.y + 1 };
    case "left":
      return { ...guard.position, x: guard.position.x - 1 };
  }
}

function nextDirection(direction: Direction): Direction {
  switch (direction) {
    case "up":
      return "right";
    case "right":
      return "down";
    case "down":
      return "left";
    case "left":
      return "up";
  }
}

function moveGuard(map: Map, guard: GuardState): GuardState {
  let movedGuard = { ...guard, position: { ...guard.position } };

  let nextPos = nextPosition(movedGuard);

  if (stateValid(map, nextPos)) {
    if (map[nextPos.y][nextPos.x].type === "obstacle") {
      movedGuard.direction = nextDirection(movedGuard.direction);
      nextPos = nextPosition(movedGuard);
    }
  }

  movedGuard.position = nextPos;
  return movedGuard;
}

function coordinateKey(coord: Coordinate): string {
  return `${coord.x}-${coord.y}`;
}

async function main() {
  let [map, guard] = await readMap();
  verbose && renderState(map, guard);

  let lastValidGuard: GuardState = guard;
  const visited: Record<string, number> = {};

  while (stateValid(map, guard.position)) {
    const key = coordinateKey(guard.position);
    if (visited[key] === undefined) {
      visited[key] = 1;
    } else {
      visited[key] += 1;
    }
    lastValidGuard = guard;
    guard = moveGuard(map, guard);
  }

  verbose && renderState(map, lastValidGuard);
  console.log(Object.keys(visited).length);
}
main();
