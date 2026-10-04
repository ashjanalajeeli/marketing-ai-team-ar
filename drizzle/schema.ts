import { int, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: varchar("role", { length: 20 }).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const marketingProjects = mysqlTable("marketing_projects", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId"),
  name: varchar("name", { length: 180 }).notNull(),
  idea: text("idea").notNull(),
  audience: text("audience").notNull(),
  country: varchar("country", { length: 100 }).notNull(),
  duration: varchar("duration", { length: 80 }).notNull(),
  budget: varchar("budget", { length: 80 }).notNull(),
  sector: varchar("sector", { length: 120 }).notNull(),
  goals: text("goals").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const marketingAgentRuns = mysqlTable("marketing_agent_runs", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  status: varchar("status", { length: 30 }).notNull().default("queued"),
  activeRole: varchar("activeRole", { length: 100 }),
  completedRoles: int("completedRoles").notNull().default(0),
  totalRoles: int("totalRoles").notNull().default(6),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const marketingOutputs = mysqlTable("marketing_outputs", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type MarketingProject = typeof marketingProjects.$inferSelect;
export type InsertMarketingProject = typeof marketingProjects.$inferInsert;
export type MarketingOutput = typeof marketingOutputs.$inferSelect;
