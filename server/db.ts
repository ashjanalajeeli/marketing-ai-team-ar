import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, marketingAgentRuns, marketingOutputs, marketingProjects, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  if (user.role) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function createMarketingProject(project: typeof marketingProjects.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حالياً");
  const result = await db.insert(marketingProjects).values(project);
  return Number(result[0].insertId);
}

export async function listMarketingProjects(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  const projects = await db.select().from(marketingProjects).where(eq(marketingProjects.ownerId, ownerId)).orderBy(desc(marketingProjects.updatedAt));
  return Promise.all(projects.map(async (project) => {
    const [output, run] = await Promise.all([getMarketingOutput(project.id), getLatestAgentRun(project.id)]);
    let outputExcerpt = "لم تُحفظ مخرجات بعد";
    try { outputExcerpt = output ? (JSON.parse(output.content).executiveSummary || "تم حفظ الحزمة التسويقية") : outputExcerpt; } catch { outputExcerpt = "توجد مخرجات تحتاج إلى مراجعة"; }
    return { ...project, runStatus: run?.status ?? "completed", outputExcerpt: String(outputExcerpt).slice(0, 120) };
  }));
}

export async function getMarketingProject(projectId: number, ownerId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(marketingProjects).where(eq(marketingProjects.id, projectId)).limit(1);
  return result[0]?.ownerId === ownerId ? result[0] : undefined;
}

export async function saveMarketingOutput(projectId: number, content: string) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة حالياً");
  const existing = await db.select().from(marketingOutputs).where(eq(marketingOutputs.projectId, projectId)).limit(1);
  if (existing[0]) {
    await db.update(marketingOutputs).set({ content }).where(eq(marketingOutputs.id, existing[0].id));
    return existing[0].id;
  }
  const result = await db.insert(marketingOutputs).values({ projectId, content });
  return Number(result[0].insertId);
}

export async function getMarketingOutput(projectId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(marketingOutputs).where(eq(marketingOutputs.projectId, projectId)).limit(1);
  return result[0];
}

export async function createAgentRun(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("قاعدة البيانات غير متاحة");
  const result = await db.insert(marketingAgentRuns).values({ projectId, status: "running", activeRole: "مدير التسويق" });
  return Number(result[0].insertId);
}

export async function updateAgentRun(runId: number, data: Partial<typeof marketingAgentRuns.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(marketingAgentRuns).set(data).where(eq(marketingAgentRuns.id, runId));
}

export async function getLatestAgentRun(projectId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(marketingAgentRuns).where(eq(marketingAgentRuns.projectId, projectId)).orderBy(desc(marketingAgentRuns.createdAt)).limit(1);
  return result[0];
}
