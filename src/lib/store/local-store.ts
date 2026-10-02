import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import path from "node:path";
import type { ReadingConfidence, DecisionState } from "@/domain/decisions/types";
import type { MarketRegime } from "@/domain/market/types";
import type { AnalysisResult } from "@/engines/orchestrator/analysis-orchestrator";

export type UserRole = "USER" | "MENTOR" | "ADMIN";

export interface LocalUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  passwordSalt: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalysisRecord {
  id: string;
  userId: string;
  asset: string;
  marketRegime: MarketRegime;
  platform: string | null;
  timeframe: string;
  cycle: string | null;
  trend: string;
  decision: DecisionState;
  confidence: ReadingConfidence;
  ruleVersion: string;
  imagePath: string | null;
  result: AnalysisResult;
  createdAt: string;
  updatedAt: string;
}

export interface OutcomeRecord {
  id: string;
  analysisId: string;
  userId: string;
  followed: "SEGUIU" | "NAO_SEGUIU";
  result: "GAIN" | "LOSS" | "NO_TRADE";
  createdAt: string;
}

export interface FeedbackRecord {
  id: string;
  analysisId: string;
  mentorId: string;
  verdict: "CORRETA" | "INCORRETA" | "PARCIAL";
  comment: string;
  createdAt: string;
}

export interface AuditRecord {
  id: string;
  actorId: string;
  action: string;
  target: string;
  previousVersion: string | null;
  nextVersion: string | null;
  createdAt: string;
}

interface DatabaseFile {
  users: LocalUser[];
  analyses: AnalysisRecord[];
  outcomes: OutcomeRecord[];
  feedback: FeedbackRecord[];
  audit: AuditRecord[];
}

const dataDir = path.join(process.cwd(), ".data");
const dbPath = path.join(dataDir, "db.json");

function emptyDb(): DatabaseFile {
  return { users: [], analyses: [], outcomes: [], feedback: [], audit: [] };
}

export function readDb(): DatabaseFile {
  mkdirSync(dataDir, { recursive: true });
  if (!existsSync(dbPath)) {
    writeFileSync(dbPath, JSON.stringify(emptyDb(), null, 2));
    return emptyDb();
  }
  return JSON.parse(readFileSync(dbPath, "utf8")) as DatabaseFile;
}

export function writeDb(db: DatabaseFile) {
  mkdirSync(dataDir, { recursive: true });
  writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

export function imageFilePath(relativePath: string): string {
  return path.join(dataDir, relativePath);
}

export function saveImage(relativePath: string, bytes: Buffer) {
  const absolute = imageFilePath(relativePath);
  mkdirSync(path.dirname(absolute), { recursive: true });
  writeFileSync(absolute, bytes);
}

export function deleteImage(relativePath: string | null) {
  if (!relativePath) return;
  const absolute = imageFilePath(relativePath);
  if (existsSync(absolute)) rmSync(absolute, { force: true });
}

export function publicUser(user: LocalUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}
