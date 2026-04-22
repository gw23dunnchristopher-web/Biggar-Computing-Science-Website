import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./revision-storage";

const ALLOWED_KINDS = new Set(["python", "html"]);
const MAX_NAME_LEN = 80;
const MAX_CODE_BYTES = 2_000_000;       // ~2 MB per project
const MAX_PROJECTS_PER_KIND = 100;       // soft per-student cap

async function requireStudent(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Login required" });
  try {
    const session = await storage.getStudentSession(token);
    if (!session) return res.status(401).json({ error: "Invalid or expired session" });
    (req as any).studentId = session.studentId;
    (req as any).studentUsername = session.username;
    next();
  } catch (err) {
    console.error("[code-projects] auth error:", err);
    res.status(500).json({ error: "Authentication check failed" });
  }
}

function validateKind(kind: string, res: Response): boolean {
  if (!ALLOWED_KINDS.has(kind)) {
    res.status(400).json({ error: "Unknown project kind" });
    return false;
  }
  return true;
}

function cleanName(raw: any): string {
  const s = String(raw ?? "").trim();
  return s ? s.slice(0, MAX_NAME_LEN) : "Untitled";
}

export function registerCodeProjectsRoutes(app: Express) {
  // List projects for a kind (returns metadata only, no code body)
  app.get("/api/code-projects/:kind", requireStudent, async (req, res) => {
    const kind = req.params.kind;
    if (!validateKind(kind, res)) return;
    try {
      const rows = await storage.listCodeProjects((req as any).studentId, kind);
      res.json(rows.map(r => ({
        id: r.id,
        name: r.name,
        updatedAt: r.updatedAt ? new Date(r.updatedAt).getTime() : null,
        createdAt: r.createdAt ? new Date(r.createdAt).getTime() : null,
      })));
    } catch (err) {
      console.error("[code-projects] list error:", err);
      res.status(500).json({ error: "Failed to list projects" });
    }
  });

  // Get full project (includes code)
  app.get("/api/code-projects/:kind/:id", requireStudent, async (req, res) => {
    const kind = req.params.kind;
    if (!validateKind(kind, res)) return;
    try {
      const p = await storage.getCodeProject((req as any).studentId, req.params.id);
      if (!p || p.kind !== kind) return res.status(404).json({ error: "Not found" });
      res.json({
        id: p.id, name: p.name, code: p.code, kind: p.kind,
        updatedAt: p.updatedAt ? new Date(p.updatedAt).getTime() : null,
        createdAt: p.createdAt ? new Date(p.createdAt).getTime() : null,
      });
    } catch (err) {
      console.error("[code-projects] get error:", err);
      res.status(500).json({ error: "Failed to load project" });
    }
  });

  // Create
  app.post("/api/code-projects/:kind", requireStudent, async (req, res) => {
    const kind = req.params.kind;
    if (!validateKind(kind, res)) return;
    const name = cleanName(req.body?.name);
    const code = String(req.body?.code ?? "");
    if (Buffer.byteLength(code, "utf8") > MAX_CODE_BYTES) {
      return res.status(413).json({ error: "Project is too large (max 1 MB)" });
    }
    try {
      const studentId = (req as any).studentId;
      const existing = await storage.listCodeProjects(studentId, kind);
      if (existing.length >= MAX_PROJECTS_PER_KIND) {
        return res.status(400).json({ error: `You have reached the limit of ${MAX_PROJECTS_PER_KIND} projects.` });
      }
      const p = await storage.createCodeProject(studentId, kind, name, code);
      res.status(201).json({
        id: p.id, name: p.name, code: p.code, kind: p.kind,
        updatedAt: p.updatedAt ? new Date(p.updatedAt).getTime() : null,
        createdAt: p.createdAt ? new Date(p.createdAt).getTime() : null,
      });
    } catch (err) {
      console.error("[code-projects] create error:", err);
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  // Update name and/or code
  app.put("/api/code-projects/:kind/:id", requireStudent, async (req, res) => {
    const kind = req.params.kind;
    if (!validateKind(kind, res)) return;
    const data: { name?: string; code?: string } = {};
    if (typeof req.body?.name === "string") data.name = cleanName(req.body.name);
    if (typeof req.body?.code === "string") {
      if (Buffer.byteLength(req.body.code, "utf8") > MAX_CODE_BYTES) {
        return res.status(413).json({ error: "Project is too large (max 1 MB)" });
      }
      data.code = req.body.code;
    }
    if (data.name === undefined && data.code === undefined) {
      return res.status(400).json({ error: "Nothing to update" });
    }
    try {
      const studentId = (req as any).studentId;
      const existing = await storage.getCodeProject(studentId, req.params.id);
      if (!existing || existing.kind !== kind) return res.status(404).json({ error: "Not found" });
      const p = await storage.updateCodeProject(studentId, req.params.id, data);
      if (!p) return res.status(404).json({ error: "Not found" });
      res.json({
        id: p.id, name: p.name, code: p.code, kind: p.kind,
        updatedAt: p.updatedAt ? new Date(p.updatedAt).getTime() : null,
        createdAt: p.createdAt ? new Date(p.createdAt).getTime() : null,
      });
    } catch (err) {
      console.error("[code-projects] update error:", err);
      res.status(500).json({ error: "Failed to save project" });
    }
  });

  // Delete
  app.delete("/api/code-projects/:kind/:id", requireStudent, async (req, res) => {
    const kind = req.params.kind;
    if (!validateKind(kind, res)) return;
    try {
      const studentId = (req as any).studentId;
      const existing = await storage.getCodeProject(studentId, req.params.id);
      if (!existing || existing.kind !== kind) return res.status(404).json({ error: "Not found" });
      await storage.deleteCodeProject(studentId, req.params.id);
      res.json({ ok: true });
    } catch (err) {
      console.error("[code-projects] delete error:", err);
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  // Bulk import (used by the "import my guest projects?" prompt on first login).
  // Body: { projects: [{ name, code }] }. Returns the created projects.
  app.post("/api/code-projects/:kind/import", requireStudent, async (req, res) => {
    const kind = req.params.kind;
    if (!validateKind(kind, res)) return;
    const projects = Array.isArray(req.body?.projects) ? req.body.projects : [];
    if (projects.length === 0) return res.json({ created: [] });
    try {
      const studentId = (req as any).studentId;
      const existing = await storage.listCodeProjects(studentId, kind);
      const headroom = Math.max(0, MAX_PROJECTS_PER_KIND - existing.length);
      const toCreate = projects.slice(0, headroom);
      const created: any[] = [];
      for (const raw of toCreate) {
        const name = cleanName(raw?.name);
        const code = String(raw?.code ?? "");
        if (Buffer.byteLength(code, "utf8") > MAX_CODE_BYTES) continue;
        const p = await storage.createCodeProject(studentId, kind, name, code);
        created.push({
          id: p.id, name: p.name, kind: p.kind,
          updatedAt: p.updatedAt ? new Date(p.updatedAt).getTime() : null,
        });
      }
      res.json({ created, skipped: projects.length - created.length });
    } catch (err) {
      console.error("[code-projects] import error:", err);
      res.status(500).json({ error: "Failed to import projects" });
    }
  });
}
