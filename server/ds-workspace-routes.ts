import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./db";
import { dsDatabases, dsEmbeds } from "@shared/ds-schema";
import { storage } from "./revision-storage";
import { eq, sql } from "drizzle-orm";

declare module "express-serve-static-core" {
    interface Request {
        wsStudentId?: string;
        wsStudentUsername?: string;
    }
}

async function requireStudent(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Authentication required" });
    const session = await storage.getStudentSession(token);
    if (!session) return res.status(401).json({ error: "Invalid or expired session" });
    req.wsStudentId = session.studentId;
    req.wsStudentUsername = session.username;
    next();
}

/* Transfers all Data Sculptor workspace databases owned by `fromUserId`
   onto the calling student's account.  Both `fromUserId` (a guest
   workspace UUID like 'student-workspace-…') and the new owner id
   (`student-<studentId>`) are server-derived from the bearer token, so a
   client cannot use this endpoint to grab someone else's databases.
*/
export function registerDsWorkspaceRoutes(app: Express) {
    if (!db) return;

    app.get("/api/ds/workspace/transfer-info", requireStudent, async (req, res) => {
        try {
            const fromUserId = String(req.query.fromUserId || "");
            if (!fromUserId.startsWith("student-workspace-")) {
                return res.json({ count: 0 });
            }
            const rows = await db!.select({ id: dsDatabases.id })
                .from(dsDatabases)
                .where(eq(dsDatabases.userId, fromUserId));
            res.json({ count: rows.length });
        } catch (e: any) {
            console.error("[ds-workspace] transfer-info error", e);
            res.status(500).json({ error: "Failed to read workspace databases" });
        }
    });

    app.post("/api/ds/workspace/transfer", requireStudent, async (req, res) => {
        try {
            const fromUserId = String((req.body && req.body.fromUserId) || "");
            if (!fromUserId.startsWith("student-workspace-")) {
                return res.status(400).json({ error: "fromUserId must be a guest workspace id" });
            }
            const toUserId = `student-${req.wsStudentId}`;
            if (fromUserId === toUserId) {
                return res.json({ transferred: 0 });
            }

            const dbResult = await db!.update(dsDatabases)
                .set({ userId: toUserId })
                .where(eq(dsDatabases.userId, fromUserId))
                .returning({ id: dsDatabases.id });
            await db!.update(dsEmbeds)
                .set({ userId: toUserId })
                .where(eq(dsEmbeds.userId, fromUserId));

            res.json({ transferred: dbResult.length });
        } catch (e: any) {
            console.error("[ds-workspace] transfer error", e);
            res.status(500).json({ error: "Failed to transfer workspace databases" });
        }
    });
}
