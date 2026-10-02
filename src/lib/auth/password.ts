import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), ".data");
const secretPath = path.join(dataDir, "auth-secret");

export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return { salt, hash };
}

export function verifyPassword(password: string, salt: string, hash: string): boolean {
  const next = scryptSync(password, salt, 32);
  const stored = Buffer.from(hash, "hex");
  if (next.length !== stored.length) return false;
  return timingSafeEqual(next, stored);
}

function secret(): string {
  mkdirSync(dataDir, { recursive: true });
  if (!existsSync(secretPath)) {
    writeFileSync(secretPath, randomBytes(32).toString("hex"), { encoding: "utf8" });
  }
  return readFileSync(secretPath, "utf8");
}

export function signSession(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ userId, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }),
  ).toString("base64url");
  const signature = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function readSession(token: string | undefined): string | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  const body = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
    userId: string;
    exp: number;
  };
  if (body.exp < Date.now()) return null;
  return body.userId;
}
