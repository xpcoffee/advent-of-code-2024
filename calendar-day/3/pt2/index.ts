import { createReadStream } from "fs";
import path from "path";
import { fileURLToPath } from "url";

//pt2 first try - 74361272 - correct!

// thirs try compress illegal chars into tokens - 175615763
// second try tweak advancing index in parser - 176488008 (too high)
// regex = 175615763
// first try = 172943232 - too low

type Token =
  | { type: "integer_literal"; value: number }
  | { type: "keyword"; value: string }
  // | { type: "identifier"; value: string }
  | {
      type:
        | "right_bracket"
        | "left_bracket"
        | "comma"
        | "mul"
        | "do"
        | "donot"
        | "reset"
        | "illegal";
    };

type Statement =
  | { type: "multiply"; lhs: number; rhs: number }
  | { type: "do" | "donot" };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// const INPUT_FILE_NAME = "input-minimal.txt";
// const INPUT_FILE_NAME = "input-minimal-pt2.txt";
const INPUT_FILE_NAME = "input.txt";

function isDigit(input: string): boolean {
  const char = input[0];
  return char >= "0" && char <= "9";
}

function isLetter(input: string): boolean {
  const char = input[0];
  return (
    (char >= "a" && char <= "z") || (char >= "A" && char <= "Z") || char == "'"
  );
}

async function lexFile(): Promise<Token[]> {
  let tokens: Token[] = [];

  var readable = createReadStream(path.join(__dirname, INPUT_FILE_NAME), {
    encoding: "utf8",
  });
  await new Promise((resolve) => readable.on("readable", resolve));

  function lexChunk(chunk: string) {
    switch (chunk) {
      case "(":
        tokens.push({ type: "left_bracket" });
        break;
      case ")":
        tokens.push({ type: "right_bracket" });
        break;
      case ",":
        tokens.push({ type: "comma" });
        break;
      default:
        let buffer: string[] = [];
        let digit = false;
        let ident = false;

        while (isDigit(chunk)) {
          digit = true;
          buffer.push(chunk);
          chunk = readable.read(1);
        }

        if (digit) {
          tokens.push({
            type: "integer_literal",
            value: Number.parseInt(buffer.join("")),
          });
          lexChunk(chunk); // we've pre-read the next chunk; we still need to lex it
          return;
        }

        while (isLetter(chunk)) {
          ident = true;
          buffer.push(chunk);
          chunk = readable.read(1);
        }

        if (ident) {
          const value = buffer.join("");
          if (value.endsWith("mul")) {
            tokens.push({
              type: "mul",
            });
          }
          if (value.endsWith("do")) {
            tokens.push({
              type: "do",
            });
          }
          if (value.endsWith("don't")) {
            tokens.push({
              type: "donot",
            });
          }
          // } else {
          //   tokens.push({
          //     type: "identifier",
          //     value: buffer.join(""),
          //   });
          // }
          lexChunk(chunk); // we've pre-read the next chunk; we still need to lex it
          return;
        }

        // compress illegal chars
        while (chunk !== null && !isLetter(chunk) && !isLetter(chunk)) {
          chunk = readable.read(1);
        }
        if (chunk == null) {
          return;
        }

        tokens.push({
          type: "illegal",
        });
        lexChunk(chunk); // we've pre-read the next chunk; we still need to lex it
    }
  }

  let chunk: unknown;

  while ((chunk = readable.read(1)) && chunk !== null) {
    if (typeof chunk !== "string") {
      continue;
    }
    lexChunk(chunk);
  }

  return tokens;
}

function parseTokens(tokens: Token[]): Statement[] {
  var statements: Statement[] = [];

  for (let i = 0; i < tokens.length; i++) {
    function advance() {
      i++;
      if (i >= tokens.length) {
        return;
      }

      return tokens[i];
    }

    let currToken: Token | undefined = tokens[i];
    switch (currToken.type) {
      case "mul":
        currToken = advance();
        if (currToken && currToken.type !== "left_bracket") {
          i -= 1; // move one back so we can parse the token again
          continue; // corrupted
        }

        currToken = advance();
        if (currToken === undefined || currToken.type !== "integer_literal") {
          i -= 1; // move one back so we can parse the token again
          continue; // corrupted
        }
        const lhs = currToken.value;

        currToken = advance();
        if (currToken && currToken.type !== "comma") {
          i -= 1; // move one back so we can parse the token again
          continue; // corrupted
        }

        currToken = advance();
        if (currToken === undefined || currToken.type !== "integer_literal") {
          i -= 1; // move one back so we can parse the token again
          continue; // corrupted
        }
        const rhs = currToken.value;

        currToken = advance();
        if (currToken && currToken.type !== "right_bracket") {
          i -= 1; // move one back so we can parse the token again
          continue; // corrupted
        }

        statements.push({ type: "multiply", lhs, rhs });
        break;
      case "do":
        currToken = advance();
        if (currToken && currToken.type !== "left_bracket") {
          i -= 1; // move one back so we can parse the token again
          continue; // corrupted
        }
        currToken = advance();
        if (currToken && currToken.type !== "right_bracket") {
          i -= 1; // move one back so we can parse the token again
          continue; // corrupted
        }
        statements.push({ type: "do" });
        break;
      case "donot":
        currToken = advance();
        if (currToken && currToken.type !== "left_bracket") {
          i -= 1; // move one back so we can parse the token again
          continue; // corrupted
        }
        currToken = advance();
        if (currToken && currToken.type !== "right_bracket") {
          i -= 1; // move one back so we can parse the token again
          continue; // corrupted
        }
        statements.push({ type: "donot" });
        break;
    }
  }

  return statements;
}

function evaluateStatements(statements: Statement[]): number[] {
  const values: number[] = [];

  let mulEnabled = true;
  for (let statement of statements) {
    switch (statement.type) {
      case "multiply":
        mulEnabled && values.push(statement.lhs * statement.rhs);
        break;
      case "do":
        mulEnabled = true;
        break;
      case "donot":
        mulEnabled = false;
        break;
    }
  }

  return values;
}

async function main() {
  const tokens = await lexFile();
  const statements = parseTokens(tokens);
  for (let statement of statements) {
    console.log(statement);
  }
  const values = evaluateStatements(statements);
  const total = values.reduce((acc, curr) => acc + curr, 0);
  console.log(total);
}
await main();
