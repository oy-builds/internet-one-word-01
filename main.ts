// The Internet in One Word — entrypoint.
// Reads entry.txt, validates it against the competition gate
// (UTF-8 text, 1 to 30 characters, not only whitespace, exactly one
// word/token with no whitespace inside), writes it byte-for-byte to
// the make.fun output location, and verifies a byte-exact round-trip.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const sourcePath = join(here, "entry.txt");
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const outputPath = join(outputDir, "entry.txt");

// --- Read the source bytes and require valid UTF-8 -------------------------
const sourceBytes = readFileSync(sourcePath);
let raw: string;
try {
  raw = new TextDecoder("utf-8", { fatal: true }).decode(sourceBytes);
} catch {
  throw new Error("entry.txt is not valid UTF-8 text");
}

// --- Validate the exact file format: one word + a single trailing newline --
if (!raw.endsWith("\n") || raw.slice(0, -1).includes("\n")) {
  throw new Error("entry.txt must be exactly one word followed by a single trailing newline");
}
const word = raw.slice(0, -1);

if (word.length === 0) {
  throw new Error("entry.txt is empty: expected exactly one word");
}
if (word.trim().length === 0) {
  throw new Error("entry.txt must not be only whitespace");
}
if (/\s/.test(word)) {
  throw new Error(`entry.txt must be a single word/token with no whitespace inside, got: ${JSON.stringify(word)}`);
}
if (raw.length < 1 || raw.length > 30) {
  throw new Error(`entry must be 1 to 30 characters for the gate, got ${raw.length}`);
}

// --- Write to the output location ------------------------------------------
mkdirSync(outputDir, { recursive: true });
writeFileSync(outputPath, sourceBytes);

// --- Verify a byte-exact round-trip ----------------------------------------
const writtenBytes = readFileSync(outputPath);
if (!writtenBytes.equals(sourceBytes)) {
  throw new Error(
    `round-trip mismatch: wrote ${writtenBytes.length} bytes, source is ${sourceBytes.length} bytes`,
  );
}
const writtenWord = new TextDecoder("utf-8", { fatal: true }).decode(writtenBytes).trim();
if (writtenWord !== word) {
  throw new Error(`round-trip word mismatch: ${JSON.stringify(writtenWord)} !== ${JSON.stringify(word)}`);
}

console.log(`wrote ${JSON.stringify(word)} (${sourceBytes.length} bytes, byte-exact) to ${outputPath}`);
