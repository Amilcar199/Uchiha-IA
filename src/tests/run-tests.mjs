import { readdirSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const directory = path.join("src", "tests", "unit");
const files = readdirSync(directory)
  .filter((file) => file.endsWith(".test.ts"))
  .map((file) => path.join(directory, file));

const result = spawnSync(
  process.execPath,
  ["--experimental-strip-types", "--import", "./src/tests/register.mjs", "--test", "--test-reporter=spec", ...files],
  { stdio: "inherit" },
);

process.exit(result.status ?? 1);
