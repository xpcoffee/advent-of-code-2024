import { createReadStream } from "fs";
import { createInterface } from "readline";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const verbose = true;

/**
 * Stream of consciousness
 *
 * a loop is a rectange with the guard walking clockwise
 * each obstacle can be part of a loop from 4 sides
 *
 *             v^
 *             ||
 *          <--x|
 *       >----x#x---<
 *            |x--->
 *            v|
 *             ^
 *
 * by adding a box we either
 *  - A) divert the guard onto an existing rectangle
 *  - B) create a new rectangle and divert the guard onto it
 *
 * diverting the guard means
 *  - C) find a point on their natural path that intersects with a loop in the correct direction
 *  - D) placing an obstacle one block ahead of the path
 *
 * for A) we need to find existing loops on the map
 *   - for each obstacle:
 *     - for each side:
 *       - walk the guard
 *       - count collisions
 *       - if 4, we found a loop
 *
 * for B) we need to find almost-loops on the map
 *   - for each obstacle:
 *     - for each side:
 *       - walk the guard
 *       - count collisions
 *       - if 3, we found a potential loop
 *       - take coords of 1st and 3rd collision to find the corner
 *
 * for C) we evaluate guard's path
 *    - for each step:
 *      - count if either:
 *        - is on edge of one of an existing loop, in the correct direction (A) - turn the guard and check direction
 *        - is at the corner of a new loop, in the correct direction (B)
 *
 */

// read input
// const rs = createReadStream(path.join(__dirname, "input.txt"));
const rs = createReadStream(path.join(__dirname, "input-minimal.txt"));
const rl = createInterface(rs);

type Coordinate = { x: number; y: number };
type Direction = "up" | "down" | "left" | "right";
type Path = { start: Coordinate; end: Coordinate; direction: Direction };
type Vector = { position: Coordinate; direction: Direction };

type Guard = Vector;
type Square = { type: "obstacle" } | { type: "empty" } | { type: "empty" };
type Obstacle = { position: Coordinate };
type Map = Square[][];

const directions: Direction[] = ["up", "down", "left", "right"];

async function readMap(): Promise<[Map, Guard, Obstacle[]]> {
  let map: Map = [];
  let guardState: Guard | undefined = undefined;
  let y = 0;
  let obstacles: Obstacle[] = [];

  for await (const line of rl) {
    const blocks = line.split("");
    let x = 0;
    const row: Square[] = blocks.map((b) => {
      const xPos = x;
      x++;
      switch (b) {
        case ".":
          return { type: "empty" };
        case "#":
          obstacles.push({ position: { x: xPos, y } });
          return { type: "obstacle" };
        case "^":
          guardState = { direction: "up", position: { x: xPos, y } };
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

  return [map, guardState, obstacles];
}

function renderState(map: Map, guard?: Guard, edges?: Path[]) {
  for (let y = 0; y < map.length; y++) {
    const row: string[] = [];
    for (let x = 0; x < map[0].length; x++) {
      if (guard && guard.position.x === x && guard.position.y === y) {
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

      const isLoopCorner = (edges ?? []).find(
        (edge) =>
          (x === edge.start.x && y === edge.start.y) ||
          (x === edge.end.x && y === edge.end.y),
      );
      if (isLoopCorner) {
        row.push("+");
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

function nextPosition(guard: Guard): Coordinate {
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

function prevPosition(guard: Guard): Coordinate {
  switch (guard.direction) {
    case "up":
      return { ...guard.position, y: guard.position.y + 1 };
    case "right":
      return { ...guard.position, x: guard.position.x - 1 };
    case "down":
      return { ...guard.position, y: guard.position.y - 1 };
    case "left":
      return { ...guard.position, x: guard.position.x + 1 };
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

function prevDirection(direction: Direction): Direction {
  switch (direction) {
    case "up":
      return "left";
    case "right":
      return "up";
    case "down":
      return "right";
    case "left":
      return "down";
  }
}

function moveGuard(map: Map, guard: Guard): Guard {
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

function findNextObstacle(
  map: Map,
  obstacle: Obstacle,
  direction: Direction,
): [Obstacle, Path] | undefined {
  let virtualGuard: Guard = { position: obstacle.position, direction };
  switch (direction) {
    case "up":
      virtualGuard.position.y + 1; // put below the obstacle
    case "down":
      virtualGuard.position.y - 1; // put above the obstacle
    case "left":
      virtualGuard.position.x + 1; // put right of the obstacle
    case "right":
      virtualGuard.position.x - 1; // put left of the obstacle
  }

  const edgeDirection = nextDirection(direction); // pre-turn the guard
  const edgeStart = virtualGuard.position;

  while (
    virtualGuard.direction === direction &&
    stateValid(map, virtualGuard.position)
  ) {
    virtualGuard = moveGuard(map, virtualGuard);
  }

  if (stateValid(map, virtualGuard.position)) {
    return undefined;
  }

  // backtrack to find obstacle - moving a guard moves "past" an obstacle
  virtualGuard.position = prevPosition(virtualGuard);
  virtualGuard.direction = prevDirection(virtualGuard.direction);
  const nextObstacle: Obstacle = { position: nextPosition(virtualGuard) };

  const loopEdge: Path = {
    direction: edgeDirection,
    start: edgeStart,
    end: virtualGuard.position,
  };
  return [nextObstacle, loopEdge];
}

function findLoop(map: Map, obstacle: Obstacle, direction: Direction) {
  const edges: Path[] = [];
  let result = findNextObstacle(map, obstacle, direction);

  while (result !== undefined && edges.length < 4) {
    const [obs, edge] = result;
    edges.push(edge);
    result = findNextObstacle(map, obs, direction);
  }

  if (edges.length === 4) {
    console.log("---");
    console.log("loop");
    renderState(map, null, edges);
  }

  if (edges.length > 2) {
    // return full loops and almost-loops
    return edges;
  }
}

// for almost-loops
function findMissingCorner(edges: Path[]): Vector {
  const [first, _second, third] = edges;
  const direction = nextDirection(third.direction);

  // determine position of missing corner from the start and end corners
  let position: Coordinate;
  switch (direction) {
    case "up":
      position = { x: third.end.x, y: first.start.y };
      break;
    case "right":
      position = { x: first.start.x, y: third.end.y };
      break;
    case "down":
      position = { x: third.end.x, y: first.start.y };
      break;
    case "left":
      position = { x: first.start.x, y: third.end.y };
      break;
  }

  return { position, direction };
}

function findLoops(
  map: Map,
  obstacles: Obstacle[],
): { loopEdges: Path[]; corners: Vector[] } {
  const loopEdges: Path[] = [];
  const corners: Vector[] = [];
  for (let obstacle of obstacles) {
    for (let direction of directions) {
      const loopResult = findLoop(map, obstacle, direction);
      if (!loopResult) {
        continue;
      }

      if (loopResult.length === 3) {
        corners.push(findMissingCorner(loopResult)); // push corner of partial loop
      } else {
        loopEdges.push(...loopResult); // push edges of complete loop
      }
    }
  }
  return { loopEdges, corners };
}

function isOnLoopEdge(guard: Guard, loopEdges: Path[]) {
  for (let edge of loopEdges) {
    if (nextDirection(guard.direction) !== edge.direction) {
      continue;
    }

    switch (edge.direction) {
      case "up":
        if (
          guard.position.x === edge.start.x &&
          guard.position.y > edge.start.y &&
          guard.position.y < edge.end.y
        ) {
          return true;
        }
        break;
      case "right":
        if (
          guard.position.y === edge.start.y &&
          guard.position.x > edge.start.x &&
          guard.position.x < edge.end.x
        ) {
          return true;
        }
        break;
      case "down":
        if (
          guard.position.x === edge.start.x &&
          guard.position.y < edge.start.y &&
          guard.position.y > edge.end.y
        ) {
          return true;
        }
        break;
      case "left":
        if (
          guard.position.y === edge.start.y &&
          guard.position.x < edge.start.x &&
          guard.position.x > edge.end.x
        ) {
          return true;
        }
        break;
    }
  }

  return false;
}

function isOnLoopCorner(guard: Guard, corners: Vector[]) {
  for (let corner of corners) {
    if (
      guard.position.x === corner.position.x &&
      guard.position.y === corner.position.y &&
      guard.direction === corner.direction
    ) {
      return true;
    }
  }
  return false;
}

async function main() {
  let [map, guard, obstacles] = await readMap();
  console.log("----");
  console.log("start");
  verbose && renderState(map, guard);

  const loopObstacles = new Set();
  const loopTriggers = findLoops(map, obstacles);

  let lastValidGuard: Guard = guard;
  while (stateValid(map, guard.position)) {
    lastValidGuard = guard;
    guard = moveGuard(map, guard);

    if (
      isOnLoopEdge(guard, loopTriggers.loopEdges) ||
      isOnLoopCorner(guard, loopTriggers.corners)
    ) {
      const obstaclePosition = nextPosition(guard);

      // stringify to avoid comparing objects
      loopObstacles.add(`${obstaclePosition.x}-${obstaclePosition.y}`);
    }
  }

  console.log("----");
  console.log("end");
  verbose && renderState(map, lastValidGuard);
  console.log("----");
  console.log("# loop edges = " + loopTriggers.loopEdges.length);
  console.log("# corners = " + loopTriggers.corners.length);
  console.log("# obstacles = " + loopObstacles.size);
}
main();
