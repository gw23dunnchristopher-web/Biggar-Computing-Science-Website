import type { Express } from "express";
import { db } from "./db";
import {
  dsDatabases, dsTables, dsFields, dsRecords,
  dsEmbeds, dsStudentSessions, dsQueries, dsForms, dsReports, dsRelationships
} from "@shared/ds-schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import alasql from "alasql";
import { GoogleGenAI } from "@google/genai";

const gemini = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

function ts(d: Date) { return d.toISOString(); }
function tsFmt(obj: any, ...keys: string[]) {
  const out = { ...obj };
  for (const k of keys) if (out[k] instanceof Date) out[k] = out[k].toISOString();
  return out;
}

/* ── Deep copy a teacher database for a student sandbox ── */
async function deepCopyDatabase(sourceDatabaseId: number, newUserId: string): Promise<number> {
  if (!db) throw new Error("Database not available");
  const [sourceDb] = await db.select().from(dsDatabases).where(eq(dsDatabases.id, sourceDatabaseId));
  if (!sourceDb) throw new Error("Source database not found");

  const [newDb] = await db.insert(dsDatabases).values({ name: `[Student Copy] ${sourceDb.name}`, userId: newUserId }).returning();

  const sourceTables = await db.select().from(dsTables).where(eq(dsTables.databaseId, sourceDatabaseId));
  for (const t of sourceTables) {
    const [newTable] = await db.insert(dsTables).values({ name: t.name, databaseId: newDb.id }).returning();
    const fields = await db.select().from(dsFields).where(eq(dsFields.tableId, t.id));
    if (fields.length > 0) {
      await db.insert(dsFields).values(fields.map(f => ({
        name: f.name, fieldType: f.fieldType, isRequired: f.isRequired,
        isPrimaryKey: f.isPrimaryKey, sortOrder: f.sortOrder, tableId: newTable.id,
        caption: f.caption, defaultValue: f.defaultValue, fieldSize: f.fieldSize, description: f.description,
      })));
    }
    const records = await db.select().from(dsRecords).where(eq(dsRecords.tableId, t.id));
    if (records.length > 0) {
      await db.insert(dsRecords).values(records.map(r => ({ tableId: newTable.id, databaseId: newDb.id, data: r.data })));
    }
  }
  return newDb.id;
}

/* ── SQL helpers ── */
const BLOCKED_SQL = [/\bDROP\s+DATABASE\b/i, /\bCREATE\s+DATABASE\b/i, /\bEXEC\b/i, /\bEXECUTE\b/i];

function stripComments(sql: string) {
  return sql.replace(/--[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "").trim();
}
function validateSql(sql: string) {
  if (!stripComments(sql)) return "Empty query.";
  for (const p of BLOCKED_SQL) if (p.test(sql)) return "That operation is not permitted in this SQL editor.";
  return null;
}
function stmtType(sql: string): "select"|"insert"|"update"|"delete"|"other" {
  const f = stripComments(sql).trimStart().toUpperCase();
  if (/^SELECT\b|^WITH\b/.test(f)) return "select";
  if (/^INSERT\b/.test(f)) return "insert";
  if (/^UPDATE\b/.test(f)) return "update";
  if (/^DELETE\b/.test(f)) return "delete";
  return "other";
}
function safeIdent(name: string) { return name.replace(/[^a-zA-Z0-9_]/g, "_"); }
function preprocessSql(sql: string, aliasMap: Record<string, string>) {
  sql = sql.replace(/"([^"]+)"/g, (_, i) => { const k = i.toLowerCase(); return aliasMap[k] ?? safeIdent(i); });
  sql = sql.replace(/\[([^\]]+)\]/g, (_, i) => { const k = i.toLowerCase(); return aliasMap[k] ?? safeIdent(i); });
  return sql;
}

/* ── Query criteria matching ── */
function matchesCriteria(value: any, criteria: string): boolean {
  if (!criteria.trim()) return true;
  const c = criteria.trim();
  const likeM = c.match(/^Like\s+"(.*)"\s*$/i);
  if (likeM) { const p = likeM[1].replace(/\*/g,".*").replace(/\?/g,"."); return new RegExp(`^${p}$`,"i").test(String(value??"")); }
  const notLikeM = c.match(/^Not Like\s+"(.*)"\s*$/i);
  if (notLikeM) { const p = notLikeM[1].replace(/\*/g,".*").replace(/\?/g,"."); return !new RegExp(`^${p}$`,"i").test(String(value??"")); }
  const betweenM = c.match(/^Between\s+(.+)\s+And\s+(.+)$/i);
  if (betweenM) { return Number(value) >= Number(betweenM[1]) && Number(value) <= Number(betweenM[2]); }
  if (/^Is Null$/i.test(c)) return value === null || value === undefined || value === "";
  if (/^Is Not Null$/i.test(c)) return value !== null && value !== undefined && value !== "";
  const cmpM = c.match(/^(>=|<=|<>|>|<|=)\s*(.+)$/);
  if (cmpM) {
    const op = cmpM[1]; const raw = cmpM[2].replace(/^"(.*)"$/,"$1");
    const nv = Number(value); const nc = Number(raw);
    if (!isNaN(nv) && !isNaN(nc)) {
      if (op === ">") return nv > nc; if (op === "<") return nv < nc; if (op === ">=") return nv >= nc;
      if (op === "<=") return nv <= nc; if (op === "<>") return nv !== nc; if (op === "=") return nv === nc;
    } else {
      const sv = String(value??"").toLowerCase(); const sc = raw.toLowerCase();
      if (op === "<>") return sv !== sc; if (op === "=") return sv === sc;
    }
  }
  return String(value??"").toLowerCase() === c.replace(/^"(.*)"$/,"$1").toLowerCase();
}

export function registerDsRoutes(app: Express) {
  if (!db) return;

  /* ── Databases ── */
  app.get("/api/ds/databases", async (req, res) => {
    const { userId } = req.query;
    if (!userId || typeof userId !== "string") return res.status(400).json({ error: "userId is required" });
    const rows = await db!.select().from(dsDatabases).where(eq(dsDatabases.userId, userId)).orderBy(dsDatabases.createdAt);
    res.json(rows.map(d => tsFmt(d, "createdAt", "updatedAt")));
  });

  app.post("/api/ds/databases", async (req, res) => {
    const { name, userId } = req.body;
    if (!name || !userId) return res.status(400).json({ error: "name and userId are required" });
    const [d] = await db!.insert(dsDatabases).values({ name, userId }).returning();
    res.status(201).json(tsFmt(d, "createdAt", "updatedAt"));
  });

  app.get("/api/ds/databases/:dbId", async (req, res) => {
    const id = parseInt(req.params.dbId);
    const [d] = await db!.select().from(dsDatabases).where(eq(dsDatabases.id, id));
    if (!d) return res.status(404).json({ error: "Database not found" });
    res.json(tsFmt(d, "createdAt", "updatedAt"));
  });

  app.put("/api/ds/databases/:dbId", async (req, res) => {
    const id = parseInt(req.params.dbId);
    const { name, taskDescription } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });
    const updateData: any = { name, updatedAt: new Date() };
    if (taskDescription !== undefined) updateData.taskDescription = taskDescription || null;
    const [d] = await db!.update(dsDatabases).set(updateData).where(eq(dsDatabases.id, id)).returning();
    if (!d) return res.status(404).json({ error: "Database not found" });
    res.json(tsFmt(d, "createdAt", "updatedAt"));
  });

  app.delete("/api/ds/databases/:dbId", async (req, res) => {
    const id = parseInt(req.params.dbId);
    await db!.delete(dsRecords).where(eq(dsRecords.databaseId, id));
    const tables = await db!.select({ id: dsTables.id }).from(dsTables).where(eq(dsTables.databaseId, id));
    for (const t of tables) await db!.delete(dsFields).where(eq(dsFields.tableId, t.id));
    await db!.delete(dsTables).where(eq(dsTables.databaseId, id));
    await db!.delete(dsQueries).where(eq(dsQueries.databaseId, id));
    await db!.delete(dsForms).where(eq(dsForms.databaseId, id));
    await db!.delete(dsReports).where(eq(dsReports.databaseId, id));
    await db!.delete(dsRelationships).where(eq(dsRelationships.databaseId, id));
    await db!.delete(dsDatabases).where(eq(dsDatabases.id, id));
    res.status(204).send();
  });

  /* ── Tables ── */
  app.get("/api/ds/databases/:dbId/tables", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    const tables = await db!.select().from(dsTables).where(eq(dsTables.databaseId, databaseId)).orderBy(dsTables.createdAt);
    res.json(tables.map(t => tsFmt(t, "createdAt", "updatedAt")));
  });

  app.post("/api/ds/databases/:dbId/tables", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    const { name, fields } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });
    const [table] = await db!.insert(dsTables).values({ name, databaseId }).returning();
    if (fields && fields.length > 0) {
      await db!.insert(dsFields).values(fields.map((f: any, idx: number) => ({
        name: f.name, fieldType: f.fieldType, isRequired: f.isRequired ?? false,
        isPrimaryKey: f.isPrimaryKey ?? false, sortOrder: f.sortOrder ?? idx,
        tableId: table.id, caption: f.caption ?? null, defaultValue: f.defaultValue ?? null,
        fieldSize: f.fieldSize ?? null, description: f.description ?? null,
      })));
    }
    const tableFields = await db!.select().from(dsFields).where(eq(dsFields.tableId, table.id)).orderBy(dsFields.sortOrder);
    res.status(201).json({ ...tsFmt(table, "createdAt", "updatedAt"), fields: tableFields.map(f => tsFmt(f, "createdAt", "updatedAt")) });
  });

  app.get("/api/ds/databases/:dbId/tables/:tableId", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    const tableId = parseInt(req.params.tableId);
    const [table] = await db!.select().from(dsTables).where(and(eq(dsTables.id, tableId), eq(dsTables.databaseId, databaseId)));
    if (!table) return res.status(404).json({ error: "Table not found" });
    const fields = await db!.select().from(dsFields).where(eq(dsFields.tableId, tableId)).orderBy(dsFields.sortOrder);
    res.json({ ...tsFmt(table, "createdAt", "updatedAt"), fields: fields.map(f => tsFmt(f, "createdAt", "updatedAt")) });
  });

  app.put("/api/ds/databases/:dbId/tables/:tableId", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    const tableId = parseInt(req.params.tableId);
    const { name, fields } = req.body;
    const [table] = await db!.update(dsTables).set({ name, updatedAt: new Date() }).where(and(eq(dsTables.id, tableId), eq(dsTables.databaseId, databaseId))).returning();
    if (!table) return res.status(404).json({ error: "Table not found" });
    await db!.delete(dsFields).where(eq(dsFields.tableId, tableId));
    if (fields && fields.length > 0) {
      await db!.insert(dsFields).values(fields.map((f: any, idx: number) => ({
        name: f.name, fieldType: f.fieldType, isRequired: f.isRequired ?? false,
        isPrimaryKey: f.isPrimaryKey ?? false, sortOrder: f.sortOrder ?? idx,
        tableId, caption: f.caption ?? null, defaultValue: f.defaultValue ?? null,
        fieldSize: f.fieldSize ?? null, description: f.description ?? null,
      })));
    }
    const updatedFields = await db!.select().from(dsFields).where(eq(dsFields.tableId, tableId)).orderBy(dsFields.sortOrder);
    res.json({ ...tsFmt(table, "createdAt", "updatedAt"), fields: updatedFields.map(f => tsFmt(f, "createdAt", "updatedAt")) });
  });

  app.delete("/api/ds/databases/:dbId/tables/:tableId", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    const tableId = parseInt(req.params.tableId);
    await db!.delete(dsRecords).where(eq(dsRecords.tableId, tableId));
    await db!.delete(dsFields).where(eq(dsFields.tableId, tableId));
    await db!.delete(dsTables).where(and(eq(dsTables.id, tableId), eq(dsTables.databaseId, databaseId)));
    res.status(204).send();
  });

  /* ── Records ── */
  app.get("/api/ds/databases/:dbId/tables/:tableId/records", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    const tableId = parseInt(req.params.tableId);
    const { sortField, sortDirection, search } = req.query as Record<string, string>;
    let records = await db!.select().from(dsRecords).where(and(eq(dsRecords.tableId, tableId), eq(dsRecords.databaseId, databaseId)));
    if (search?.trim()) {
      const s = search.toLowerCase();
      records = records.filter(r => Object.values(r.data as any).some((v: any) => v !== null && String(v).toLowerCase().includes(s)));
    }
    if (sortField) {
      const dir = sortDirection === "desc" ? -1 : 1;
      records = records.sort((a, b) => {
        const av = (a.data as any)[sortField] ?? ""; const bv = (b.data as any)[sortField] ?? "";
        return av < bv ? -dir : av > bv ? dir : 0;
      });
    } else {
      records = records.sort((a, b) => a.id - b.id);
    }
    res.json(records.map(r => tsFmt(r, "createdAt", "updatedAt")));
  });

  app.post("/api/ds/databases/:dbId/tables/:tableId/records", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    const tableId = parseInt(req.params.tableId);
    const { data } = req.body;
    if (!data || typeof data !== "object") return res.status(400).json({ error: "data is required" });
    const fields = await db!.select().from(dsFields).where(eq(dsFields.tableId, tableId));
    const autoFields = fields.filter(f => f.fieldType === "autonumber");
    const processedData = { ...data };
    for (const af of autoFields) {
      const existing = await db!.select().from(dsRecords).where(eq(dsRecords.tableId, tableId));
      let maxVal = 0;
      for (const r of existing) { const v = parseInt((r.data as any)[af.name] ?? "0"); if (!isNaN(v) && v > maxVal) maxVal = v; }
      processedData[af.name] = maxVal + 1;
    }
    const [record] = await db!.insert(dsRecords).values({ tableId, databaseId, data: processedData }).returning();
    res.status(201).json(tsFmt(record, "createdAt", "updatedAt"));
  });

  app.put("/api/ds/databases/:dbId/tables/:tableId/records/:recordId", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    const tableId = parseInt(req.params.tableId);
    const recordId = parseInt(req.params.recordId);
    const { data } = req.body;
    if (!data || typeof data !== "object") return res.status(400).json({ error: "data is required" });
    const [record] = await db!.update(dsRecords).set({ data, updatedAt: new Date() }).where(and(eq(dsRecords.id, recordId), eq(dsRecords.tableId, tableId), eq(dsRecords.databaseId, databaseId))).returning();
    if (!record) return res.status(404).json({ error: "Record not found" });
    res.json(tsFmt(record, "createdAt", "updatedAt"));
  });

  app.delete("/api/ds/databases/:dbId/tables/:tableId/records/:recordId", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    const tableId = parseInt(req.params.tableId);
    const recordId = parseInt(req.params.recordId);
    await db!.delete(dsRecords).where(and(eq(dsRecords.id, recordId), eq(dsRecords.tableId, tableId), eq(dsRecords.databaseId, databaseId)));
    res.status(204).send();
  });

  /* ── Sandboxes (databases with embed tokens) ── */
  app.get("/api/ds/sandboxes", async (req, res) => {
    const { userId } = req.query;
    if (!userId || typeof userId !== "string") return res.status(400).json({ error: "userId is required" });
    const host = process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}` : "http://localhost:3000";
    const databases = await db!.select().from(dsDatabases).where(eq(dsDatabases.userId, userId)).orderBy(dsDatabases.createdAt);
    const embeds = await db!.select().from(dsEmbeds).where(eq(dsEmbeds.userId, userId));
    const embedByDbId = new Map(embeds.map(e => [e.databaseId, e]));
    const sandboxes = databases
      .filter(d => embedByDbId.has(d.id))
      .map(d => {
        const embed = embedByDbId.get(d.id)!;
        const embedUrl = `${host}/data-sculptor/?embed=${embed.token}`;
        const iframeCode = `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0" style="border: 1px solid #ccc; border-radius: 4px;"></iframe>`;
        return { ...tsFmt(d, "createdAt", "updatedAt"), token: embed.token, embedUrl, iframeCode };
      });
    res.json(sandboxes);
  });

  app.post("/api/ds/sandboxes", async (req, res) => {
    const { name, userId, taskDescription } = req.body;
    if (!name || !userId) return res.status(400).json({ error: "name and userId are required" });
    const host = process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}` : "http://localhost:3000";
    const [d] = await db!.insert(dsDatabases).values({ name, userId, taskDescription: taskDescription?.trim() || null }).returning();
    const token = crypto.randomBytes(16).toString("hex");
    await db!.insert(dsEmbeds).values({ token, databaseId: d.id, userId }).returning();
    const embedUrl = `${host}/data-sculptor/?embed=${token}`;
    const iframeCode = `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0" style="border: 1px solid #ccc; border-radius: 4px;"></iframe>`;
    res.status(201).json({ ...tsFmt(d, "createdAt", "updatedAt"), token, embedUrl, iframeCode });
  });

  app.delete("/api/ds/sandboxes/:dbId", async (req, res) => {
    const id = parseInt(req.params.dbId);
    await db!.delete(dsEmbeds).where(eq(dsEmbeds.databaseId, id));
    await db!.delete(dsStudentSessions).where(eq(dsStudentSessions.sandboxDatabaseId, id));
    await db!.delete(dsRecords).where(eq(dsRecords.databaseId, id));
    const tables = await db!.select({ id: dsTables.id }).from(dsTables).where(eq(dsTables.databaseId, id));
    for (const t of tables) {
      await db!.delete(dsFields).where(eq(dsFields.tableId, t.id));
    }
    await db!.delete(dsTables).where(eq(dsTables.databaseId, id));
    await db!.delete(dsDatabases).where(eq(dsDatabases.id, id));
    res.status(204).send();
  });

  /* ── Embeds ── */
  app.post("/api/ds/embeds", async (req, res) => {
    const { databaseId, userId } = req.body;
    if (!databaseId || !userId) return res.status(400).json({ error: "databaseId and userId are required" });
    const token = crypto.randomBytes(16).toString("hex");
    const [embed] = await db!.insert(dsEmbeds).values({ token, databaseId, userId }).returning();
    const host = process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}` : `${req.protocol}://${req.headers.host}`;
    const embedUrl = `${host}/data-sculptor/?embed=${token}`;
    const iframeCode = `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0" style="border: 1px solid #ccc; border-radius: 4px;"></iframe>`;
    res.status(201).json({ token: embed.token, databaseId: embed.databaseId, embedUrl, iframeCode, createdAt: embed.createdAt.toISOString() });
  });

  app.get("/api/ds/embeds/:token", async (req, res) => {
    const { token } = req.params;
    const sessionKey = req.headers["x-session-key"] as string | undefined;
    const [embed] = await db!.select().from(dsEmbeds).where(eq(dsEmbeds.token, token));
    if (!embed) return res.status(404).json({ error: "Embed not found" });
    let sandboxDatabaseId: number;
    if (sessionKey) {
      const [session] = await db!.select().from(dsStudentSessions).where(and(eq(dsStudentSessions.sessionKey, sessionKey), eq(dsStudentSessions.token, token)));
      if (session) {
        sandboxDatabaseId = session.sandboxDatabaseId;
      } else {
        sandboxDatabaseId = await deepCopyDatabase(embed.databaseId, `student-session-${sessionKey}`);
        await db!.insert(dsStudentSessions).values({ token, sessionKey, sandboxDatabaseId });
      }
    } else {
      sandboxDatabaseId = await deepCopyDatabase(embed.databaseId, `student-anon-${Date.now()}`);
    }
    const [database] = await db!.select().from(dsDatabases).where(eq(dsDatabases.id, sandboxDatabaseId));
    if (!database) return res.status(404).json({ error: "Sandbox database not found" });
    const [originalDb] = await db!.select({ taskDescription: dsDatabases.taskDescription }).from(dsDatabases).where(eq(dsDatabases.id, embed.databaseId));
    const tables = await db!.select().from(dsTables).where(eq(dsTables.databaseId, sandboxDatabaseId)).orderBy(dsTables.createdAt);
    const tablesWithFields = await Promise.all(tables.map(async (table) => {
      const fields = await db!.select().from(dsFields).where(eq(dsFields.tableId, table.id)).orderBy(dsFields.sortOrder);
      return { ...tsFmt(table, "createdAt", "updatedAt"), fields: fields.map(f => tsFmt(f, "createdAt", "updatedAt")) };
    }));
    res.json({
      database: { ...tsFmt(database, "createdAt", "updatedAt"), taskDescription: originalDb?.taskDescription ?? null },
      tables: tablesWithFields,
    });
  });

  app.post("/api/ds/embeds/:token/reset", async (req, res) => {
    const { token } = req.params;
    const sessionKey = req.headers["x-session-key"] as string | undefined;
    if (!sessionKey) return res.status(400).json({ error: "No session key" });
    const [session] = await db!.select().from(dsStudentSessions).where(and(eq(dsStudentSessions.sessionKey, sessionKey), eq(dsStudentSessions.token, token)));
    if (!session) return res.status(404).json({ error: "Session not found" });
    const dbId = session.sandboxDatabaseId;
    await db!.delete(dsStudentSessions).where(and(eq(dsStudentSessions.sessionKey, sessionKey), eq(dsStudentSessions.token, token)));
    await db!.delete(dsRecords).where(eq(dsRecords.databaseId, dbId));
    const tables = await db!.select({ id: dsTables.id }).from(dsTables).where(eq(dsTables.databaseId, dbId));
    for (const t of tables) await db!.delete(dsFields).where(eq(dsFields.tableId, t.id));
    await db!.delete(dsTables).where(eq(dsTables.databaseId, dbId));
    await db!.delete(dsQueries).where(eq(dsQueries.databaseId, dbId));
    await db!.delete(dsForms).where(eq(dsForms.databaseId, dbId));
    await db!.delete(dsReports).where(eq(dsReports.databaseId, dbId));
    await db!.delete(dsRelationships).where(eq(dsRelationships.databaseId, dbId));
    await db!.delete(dsDatabases).where(eq(dsDatabases.id, dbId));
    res.json({ ok: true });
  });

  /* ── Queries ── */
  app.get("/api/ds/databases/:dbId/queries", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    res.json(await db!.select().from(dsQueries).where(eq(dsQueries.databaseId, databaseId)));
  });

  app.post("/api/ds/databases/:dbId/queries", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    const { name, definition } = req.body;
    const [q] = await db!.insert(dsQueries).values({ name: name || "Query1", databaseId, definition: definition || {} }).returning();
    res.status(201).json(q);
  });

  app.get("/api/ds/databases/:dbId/queries/:queryId", async (req, res) => {
    const [q] = await db!.select().from(dsQueries).where(eq(dsQueries.id, parseInt(req.params.queryId)));
    if (!q) return res.status(404).json({ error: "Query not found" });
    res.json(q);
  });

  app.put("/api/ds/databases/:dbId/queries/:queryId", async (req, res) => {
    const { name, definition } = req.body;
    const [q] = await db!.update(dsQueries).set({ name, definition, updatedAt: new Date() }).where(eq(dsQueries.id, parseInt(req.params.queryId))).returning();
    if (!q) return res.status(404).json({ error: "Query not found" });
    res.json(q);
  });

  app.delete("/api/ds/databases/:dbId/queries/:queryId", async (req, res) => {
    await db!.delete(dsQueries).where(eq(dsQueries.id, parseInt(req.params.queryId)));
    res.status(204).send();
  });

  app.post("/api/ds/databases/:dbId/queries/:queryId/run", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    const queryId = parseInt(req.params.queryId);
    const [qRow] = await db!.select().from(dsQueries).where(eq(dsQueries.id, queryId));
    if (!qRow) return res.status(404).json({ error: "Query not found" });
    const definition = qRow.definition as any;
    const tables = Array.isArray(definition.tables) ? definition.tables : [];
    const columns = Array.isArray(definition.columns) ? definition.columns : [];
    const tableData: Record<number, any[]> = {};
    for (const t of tables) {
      const records = await db!.select().from(dsRecords).where(and(eq(dsRecords.tableId, t.tableId), eq(dsRecords.databaseId, databaseId)));
      tableData[t.tableId] = records.map(r => r.data);
    }
    let resultRows: Record<string, any>[] = [];
    if (tables.length === 1) {
      const t = tables[0];
      resultRows = (tableData[t.tableId] || []).map(row => {
        const out: Record<string,any> = {};
        for (const c of columns) if (c.tableId === t.tableId) out[`${c.tableName}.${c.fieldName}`] = (row as any)[c.fieldName];
        return out;
      });
    }
    for (const col of columns) {
      if (col.criteria) resultRows = resultRows.filter(row => matchesCriteria(row[`${col.tableName}.${col.fieldName}`], col.criteria));
    }
    const sortColumns = columns.filter((c: any) => c.sort);
    if (sortColumns.length > 0) {
      resultRows.sort((a, b) => {
        for (const col of sortColumns) {
          const k = `${col.tableName}.${col.fieldName}`;
          const av = a[k]; const bv = b[k]; const aStr = String(av??""); const bStr = String(bv??"");
          const an = Number(av); const bn = Number(bv); let cmp = 0;
          if (!isNaN(an) && !isNaN(bn)) cmp = an - bn; else cmp = aStr.localeCompare(bStr);
          if (cmp !== 0) return col.sort === "asc" ? cmp : -cmp;
        }
        return 0;
      });
    }
    const showCols = columns.filter((c: any) => c.show);
    const outputCols = showCols.map((c: any) => ({ key: `${c.tableName}.${c.fieldName}`, label: c.alias || c.fieldName, fieldName: c.fieldName, tableName: c.tableName }));
    const outputRows = resultRows.map(row => { const out: Record<string,any> = {}; for (const c of outputCols) out[c.key] = row[c.key]; return out; });
    res.json({ columns: outputCols, rows: outputRows });
  });

  /* ── Forms ── */
  app.get("/api/ds/databases/:dbId/forms", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    res.json(await db!.select().from(dsForms).where(eq(dsForms.databaseId, databaseId)));
  });

  app.post("/api/ds/databases/:dbId/forms", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    const { name, definition } = req.body;
    const [f] = await db!.insert(dsForms).values({ name: name || "Form1", databaseId, definition: definition || {} }).returning();
    res.status(201).json(f);
  });

  app.get("/api/ds/databases/:dbId/forms/:formId", async (req, res) => {
    const [f] = await db!.select().from(dsForms).where(eq(dsForms.id, parseInt(req.params.formId)));
    if (!f) return res.status(404).json({ error: "Form not found" });
    res.json(f);
  });

  app.put("/api/ds/databases/:dbId/forms/:formId", async (req, res) => {
    const { name, definition } = req.body;
    const [f] = await db!.update(dsForms).set({ name, definition, updatedAt: new Date() }).where(eq(dsForms.id, parseInt(req.params.formId))).returning();
    if (!f) return res.status(404).json({ error: "Form not found" });
    res.json(f);
  });

  app.delete("/api/ds/databases/:dbId/forms/:formId", async (req, res) => {
    await db!.delete(dsForms).where(eq(dsForms.id, parseInt(req.params.formId)));
    res.status(204).send();
  });

  /* ── Reports ── */
  app.get("/api/ds/databases/:dbId/reports", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    res.json(await db!.select().from(dsReports).where(eq(dsReports.databaseId, databaseId)));
  });

  app.post("/api/ds/databases/:dbId/reports", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    const { name, definition } = req.body;
    const [r] = await db!.insert(dsReports).values({ name: name || "Report1", databaseId, definition: definition || {} }).returning();
    res.status(201).json(r);
  });

  app.get("/api/ds/databases/:dbId/reports/:reportId", async (req, res) => {
    const [r] = await db!.select().from(dsReports).where(eq(dsReports.id, parseInt(req.params.reportId)));
    if (!r) return res.status(404).json({ error: "Report not found" });
    res.json(r);
  });

  app.put("/api/ds/databases/:dbId/reports/:reportId", async (req, res) => {
    const { name, definition } = req.body;
    const [r] = await db!.update(dsReports).set({ name, definition, updatedAt: new Date() }).where(eq(dsReports.id, parseInt(req.params.reportId))).returning();
    if (!r) return res.status(404).json({ error: "Report not found" });
    res.json(r);
  });

  app.delete("/api/ds/databases/:dbId/reports/:reportId", async (req, res) => {
    await db!.delete(dsReports).where(eq(dsReports.id, parseInt(req.params.reportId)));
    res.status(204).send();
  });

  /* ── Relationships ── */
  app.get("/api/ds/databases/:dbId/relationships", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    const rows = await db!.select().from(dsRelationships).where(eq(dsRelationships.databaseId, databaseId));
    res.json(rows.map(r => tsFmt(r, "createdAt")));
  });

  app.post("/api/ds/databases/:dbId/relationships", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    const { fromTableId, fromFieldId, toTableId, toFieldId, relationshipType } = req.body;
    if (!fromTableId || !fromFieldId || !toTableId || !toFieldId) return res.status(400).json({ error: "fromTableId, fromFieldId, toTableId, toFieldId are required" });
    const [r] = await db!.insert(dsRelationships).values({ databaseId, fromTableId, fromFieldId, toTableId, toFieldId, relationshipType: relationshipType || "one-to-many" }).returning();
    res.status(201).json(tsFmt(r, "createdAt"));
  });

  app.delete("/api/ds/databases/:dbId/relationships/:relId", async (req, res) => {
    await db!.delete(dsRelationships).where(and(eq(dsRelationships.id, parseInt(req.params.relId)), eq(dsRelationships.databaseId, parseInt(req.params.dbId))));
    res.status(204).send();
  });

  /* ── SQL ── */
  app.post("/api/ds/databases/:dbId/sql", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    const { sql: rawSql } = req.body;
    if (!rawSql || typeof rawSql !== "string") return res.status(400).json({ error: "sql is required" });
    const err = validateSql(rawSql);
    if (err) return res.status(400).json({ error: err });
    try {
      const start = Date.now();
      const tables = await db!.select().from(dsTables).where(eq(dsTables.databaseId, databaseId));
      if (tables.length === 0) return res.status(400).json({ error: "No tables found in this database. Create a table first." });
      const aliasMap: Record<string, string> = {};
      for (const t of tables) aliasMap[t.name.toLowerCase()] = safeIdent(t.name);
      const processedSql = preprocessSql(rawSql.trim(), aliasMap);
      const type = stmtType(rawSql);
      const instanceDb = `ds_${databaseId}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      alasql(`CREATE DATABASE ${instanceDb}`);
      alasql(`USE ${instanceDb}`);
      try {
        for (const table of tables) {
          const safeName = safeIdent(table.name);
          const fields = await db!.select().from(dsFields).where(eq(dsFields.tableId, table.id)).orderBy(dsFields.sortOrder);
          const records = await db!.select().from(dsRecords).where(and(eq(dsRecords.tableId, table.id), eq(dsRecords.databaseId, databaseId)));
          if (fields.length === 0) { alasql(`CREATE TABLE ${safeName} (id INT)`); continue; }
          const colDefs = fields.map(f => {
            const safeFld = safeIdent(f.name);
            let typ = "STRING";
            if (f.fieldType === "number" || f.fieldType === "autonumber" || f.fieldType === "currency") typ = "NUMBER";
            else if (f.fieldType === "date/time") typ = "STRING";
            else if (f.fieldType === "yes/no") typ = "BOOLEAN";
            return `${safeFld} ${typ}`;
          });
          alasql(`CREATE TABLE ${safeName} (${colDefs.join(", ")})`);
          if (records.length > 0) {
            const dataRows = records.map(r => {
              const out: Record<string,any> = {};
              for (const f of fields) out[safeIdent(f.name)] = (r.data as any)[f.name] ?? null;
              return out;
            });
            alasql(`INSERT INTO ${safeName} SELECT * FROM ?`, [dataRows]);
          }
        }
        const result = alasql(processedSql);
        const elapsed = Date.now() - start;
        if (type === "select") {
          const rows = Array.isArray(result) ? result : [];
          const cols = rows.length > 0 ? Object.keys(rows[0]) : [];
          return res.json({ columns: cols, rows, rowCount: rows.length, executionTime: elapsed });
        }
        return res.json({ rowsAffected: typeof result === "number" ? result : 1, executionTime: elapsed });
      } finally {
        try { alasql(`DROP DATABASE ${instanceDb}`); } catch {}
      }
    } catch (e: any) {
      const tableNames = (await db!.select({ name: dsTables.name }).from(dsTables).where(eq(dsTables.databaseId, databaseId))).map(t => t.name);
      let msg = e?.message || "Query execution failed";
      if (/table.*not.*(exist|found)|no such table/i.test(msg)) msg = `Table not found. Available: ${tableNames.join(", ")}. Check spelling.`;
      else if (/column.*not.*(found|exist)/i.test(msg)) msg = "Column not found. Check the field name spelling.";
      else if (/syntax error/i.test(msg)) msg = `Syntax error: ${msg}`;
      return res.status(400).json({ error: msg });
    }
  });

  app.get("/api/ds/databases/:dbId/sql/schema", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    const tables = await db!.select().from(dsTables).where(eq(dsTables.databaseId, databaseId));
    const schema = await Promise.all(tables.map(async (table) => {
      const fields = await db!.select().from(dsFields).where(eq(dsFields.tableId, table.id));
      return { id: table.id, name: table.name, fields: fields.sort((a,b) => a.sortOrder - b.sortOrder).map(f => ({ name: f.name, fieldType: f.fieldType, isPrimaryKey: f.isPrimaryKey })) };
    }));
    res.json(schema);
  });

  /* ── Tools: Analyse ── */
  app.get("/api/ds/databases/:dbId/analyse", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    const tables = await db!.select().from(dsTables).where(eq(dsTables.databaseId, databaseId));
    const tableStats = await Promise.all(tables.map(async table => {
      const fields = await db!.select().from(dsFields).where(eq(dsFields.tableId, table.id));
      const records = await db!.select().from(dsRecords).where(and(eq(dsRecords.tableId, table.id), eq(dsRecords.databaseId, databaseId)));
      const rowCount = records.length;
      const fieldStats = fields.sort((a,b) => a.sortOrder - b.sortOrder).map(f => {
        const emptyCount = records.filter(r => { const v = (r.data as any)[f.name]; return v === null || v === undefined || v === ""; }).length;
        return { id: f.id, name: f.name, fieldType: f.fieldType, isPrimaryKey: f.isPrimaryKey, emptyCount, fillRate: rowCount > 0 ? Math.round(((rowCount - emptyCount)/rowCount)*100) : 100 };
      });
      return { id: table.id, name: table.name, rowCount, fieldCount: fields.length, fieldStats, createdAt: table.createdAt.toISOString() };
    }));
    res.json({ tables: tableStats, totalTables: tables.length, totalRecords: tableStats.reduce((s,t) => s+t.rowCount, 0) });
  });

  app.post("/api/ds/databases/:dbId/compact", async (req, res) => {
    const databaseId = parseInt(req.params.dbId);
    const tables = await db!.select({ id: dsTables.id }).from(dsTables).where(eq(dsTables.databaseId, databaseId));
    const validIds = new Set(tables.map(t => t.id));
    const allRecords = await db!.select({ id: dsRecords.id, tableId: dsRecords.tableId }).from(dsRecords).where(eq(dsRecords.databaseId, databaseId));
    const orphans = allRecords.filter(r => !validIds.has(r.tableId));
    for (const r of orphans) await db!.delete(dsRecords).where(eq(dsRecords.id, r.id));
    res.json({ message: "Compact & Repair complete", tablesChecked: tables.length, orphanedRecordsRemoved: orphans.length, status: "healthy" });
  });

  /* ── AI Database Structure Grading (for student embed / N4 mode) ── */
  app.post("/api/ds/grade-database", async (req, res) => {
    const { sandboxDatabaseId, taskDescription: clientTaskDesc } = req.body;
    if (!sandboxDatabaseId) return res.status(400).json({ error: "sandboxDatabaseId is required" });
    if (!gemini) return res.status(503).json({ error: "AI marking is not available (no API key configured)" });

    const dbId = parseInt(sandboxDatabaseId);
    const [dbRow] = await db!.select().from(dsDatabases).where(eq(dsDatabases.id, dbId));
    if (!dbRow) return res.status(404).json({ error: "Database not found" });

    const taskDescription = clientTaskDesc || dbRow.taskDescription || "";

    const tables = await db!.select().from(dsTables).where(eq(dsTables.databaseId, dbId)).orderBy(dsTables.createdAt);
    const tableDetails = await Promise.all(tables.map(async (t) => {
      const fields = await db!.select().from(dsFields).where(eq(dsFields.tableId, t.id)).orderBy(dsFields.sortOrder);
      const records = await db!.select().from(dsRecords).where(and(eq(dsRecords.tableId, t.id), eq(dsRecords.databaseId, dbId)));
      const sampleRows = records.slice(0, 5).map(r => r.data);
      return { name: t.name, fields: fields.map(f => ({ name: f.name, type: f.fieldType, isPrimaryKey: f.isPrimaryKey, isRequired: f.isRequired })), rowCount: records.length, sampleRows };
    }));

    const dbSummary = tableDetails.map(t =>
      `Table: ${t.name} (${t.rowCount} row${t.rowCount !== 1 ? "s" : ""})\n  Fields: ${t.fields.map(f => `${f.name} (${f.type}${f.isPrimaryKey ? ", PK" : ""}${f.isRequired ? ", required" : ""})`).join(", ")}\n  Sample data: ${t.sampleRows.length > 0 ? t.sampleRows.map(r => JSON.stringify(r)).join("; ") : "none"}`
    ).join("\n\n");

    const prompt = `You are a Computing Science teacher marking an N4 Computing Science database exercise.

${taskDescription ? `TASK: ${taskDescription}\n` : ""}STUDENT'S DATABASE:
${dbSummary}

Please mark this database. Your response must be structured as follows:
1. **Mark**: Give a mark out of 4 (0–4) based on how well the database design matches the task requirements.
2. **Feedback**: 2–4 sentences of specific, constructive feedback for a Computing Science student. Comment on the table structure, field names, data types, and any sample data entered.
3. **Suggestions**: One or two practical improvements the student could make to their database design.

Be encouraging but honest. Use British English spelling.`;

    try {
      const response = await gemini.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });
      res.json({ feedback: response.text || "" });
    } catch (err: any) {
      console.error("DS database grading error:", err?.message || err);
      res.status(500).json({ error: "AI marking failed. Please try again." });
    }
  });

  /* ── AI SQL Grading ── */
  app.post("/api/ds/grade-sandbox", async (req, res) => {
    const { databaseId, sql, results, taskDescription: clientTaskDesc } = req.body;
    if (!sql) return res.status(400).json({ error: "sql is required" });
    if (!gemini) return res.status(503).json({ error: "AI grading is not available (no API key configured)" });

    let taskDescription = clientTaskDesc || "";
    if (!taskDescription && databaseId) {
      const [dbRow] = await db!.select({ taskDescription: dsDatabases.taskDescription }).from(dsDatabases).where(eq(dsDatabases.id, parseInt(databaseId)));
      taskDescription = dbRow?.taskDescription || "";
    }

    const resultSummary = results
      ? (results.columns && results.rows
          ? `Columns: ${results.columns.join(", ")}\nRows (first 10):\n${results.rows.slice(0, 10).map((r: any) => JSON.stringify(r)).join("\n")}`
          : results.isDml
            ? `${results.statementType?.toUpperCase()} successful — ${results.rowsAffected} row(s) affected`
            : "No results")
      : "Query was not run";

    const prompt = `You are a Computing Science teacher marking a student's SQL query exercise.

${taskDescription ? `TASK: ${taskDescription}\n` : ""}STUDENT'S SQL QUERY:
\`\`\`sql
${sql}
\`\`\`

QUERY RESULTS:
${resultSummary}

Please mark this SQL query. Your response must be structured as follows:
1. **Mark**: Give a mark out of 4 (0–4) based on correctness and efficiency.
2. **Feedback**: 2–4 sentences of specific, constructive feedback written for a Computing Science student. Mention what was done well and what could be improved.
3. **Suggestions**: One or two practical improvements the student could make.

Be encouraging but honest. Use British English spelling.`;

    try {
      const response = await gemini.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });
      const text = response.text || "";
      res.json({ feedback: text });
    } catch (err: any) {
      console.error("DS grading error:", err?.message || err);
      res.status(500).json({ error: "AI grading failed. Please try again." });
    }
  });
}
