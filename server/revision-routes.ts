import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage, db } from "./revision-storage";
import { sessions as sessionsTable, studentSessions as studentSessionsTable } from "@shared/revision-schema";
import { eq, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import multer from "multer";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";
import { sendPasswordResetEmail } from "./email";
import { objectStorageClient } from "./replit_integrations/object_storage";

const uploadDir = path.join(process.cwd(), "public", "assets");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const fileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "_" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "_" + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: fileStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});

const resourceUploadDir = path.join(process.cwd(), "public", "resources");
if (!fs.existsSync(resourceUploadDir)) {
  fs.mkdirSync(resourceUploadDir, { recursive: true });
}

const resourceStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, resourceUploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "_" + Math.round(Math.random() * 1e9);
    cb(null, "resource_" + uniqueSuffix + path.extname(file.originalname));
  }
});

const resourceUpload = multer({
  storage: resourceStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedExts = /\.(accdb|mdb|html|htm|css|js|sql|txt|pdf|zip|py|vb|csv|json|xml|jpg|jpeg|png|gif|webp)$/i;
    if (allowedExts.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed"));
    }
  }
});

// Initialize Gemini AI (primary - use until quota runs out)
const gemini = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

// Initialize Groq AI (fallback when Gemini quota exceeded)
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "",
  baseURL: "https://api.groq.com/openai/v1",
});

// Failed login tracking for account lockout
const failedLogins = new Map<string, { count: number; lockedUntil: number }>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000;

async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    if (db) {
      const rows = await db.select().from(sessionsTable).where(eq(sessionsTable.token, token));
      const session = rows[0];
      if (!session || session.expiresAt < new Date()) {
        if (session) await db.delete(sessionsTable).where(eq(sessionsTable.token, token));
        return res.status(401).json({ message: "Invalid or expired session" });
      }
    } else {
      return res.status(503).json({ message: "Database unavailable" });
    }
  } catch (err) {
    console.error("Auth check error:", err);
    return res.status(500).json({ message: "Authentication check failed" });
  }

  next();
}

async function requireStudentAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ message: "Student authentication required" });
  }
  try {
    const session = await storage.getStudentSession(token);
    if (!session) {
      return res.status(401).json({ message: "Invalid or expired student session" });
    }
    (req as any).studentId = session.studentId;
    (req as any).studentUsername = session.username;
    next();
  } catch (err) {
    console.error("Student auth check error:", err);
    return res.status(500).json({ message: "Authentication check failed" });
  }
}

function sanitizeInput(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

function validateId(id: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(id) && id.length <= 128;
}

// Cache for AI grading results to reduce API costs (key: hash of answer+scheme, value: result)
const gradingCache = new Map<string, { marks: number; feedback: string; suggestions: string; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

async function uploadToCloud(localFilePath: string, cloudFileName: string): Promise<string | null> {
  try {
    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (!bucketId) {
      console.log("Cloud storage not configured (no DEFAULT_OBJECT_STORAGE_BUCKET_ID)");
      return null;
    }
    const bucket = objectStorageClient.bucket(bucketId);
    const destination = `public/${cloudFileName}`;
    const ext = path.extname(cloudFileName).toLowerCase();
    const contentTypes: Record<string, string> = {
      ".pdf": "application/pdf", ".html": "text/html", ".htm": "text/html",
      ".css": "text/css", ".js": "application/javascript", ".sql": "text/plain",
      ".txt": "text/plain", ".py": "text/x-python", ".vb": "text/plain",
      ".csv": "text/csv", ".json": "application/json", ".xml": "application/xml",
      ".zip": "application/zip", ".accdb": "application/msaccess", ".mdb": "application/msaccess",
      ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
      ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml",
    };
    await bucket.upload(localFilePath, {
      destination,
      resumable: false,
      metadata: { contentType: contentTypes[ext] || "application/octet-stream" },
    });
    console.log(`Uploaded to cloud: ${cloudFileName}`);
    return `cloud:${cloudFileName}`;
  } catch (err) {
    console.error("Cloud upload failed:", err);
    return null;
  }
}

async function downloadFromCloud(cloudFileName: string): Promise<Buffer | null> {
  try {
    const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
    if (!bucketId) return null;
    const bucket = objectStorageClient.bucket(bucketId);
    const file = bucket.file(`public/${cloudFileName}`);
    const [exists] = await file.exists();
    if (!exists) return null;
    const [contents] = await file.download();
    return contents;
  } catch (err) {
    console.error("Cloud download failed:", err);
    return null;
  }
}

function hashGradingRequest(studentAnswer: string, markingScheme: string[], maxMarks: number, aiGuidance?: string): string {
  const normalized = `${studentAnswer.toLowerCase().trim()}|${JSON.stringify(markingScheme)}|${maxMarks}|${aiGuidance || ''}`;
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
}

export async function registerRoutes(
  app: Express
): Promise<void> {
  // Serve static files from public directory
  app.use("/assets", (await import("express")).default.static(uploadDir));
  app.use("/resources", (await import("express")).default.static(resourceUploadDir, {
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      const forcedMimeTypes: Record<string, string> = {
        ".txt": "text/plain", ".sql": "text/plain", ".py": "text/plain",
        ".vb": "text/plain", ".css": "text/css", ".js": "application/javascript",
        ".csv": "text/csv", ".json": "application/json", ".xml": "application/xml",
      };
      if (forcedMimeTypes[ext]) {
        res.setHeader("Content-Type", forcedMimeTypes[ext]);
      }
    },
  }));

  app.get("/api/download-resource", async (req, res) => {
    const url = req.query.url as string;
    const fileName = req.query.name as string;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "Missing url parameter" });
    }
    if (url.startsWith("https://storage.googleapis.com/")) {
      try {
        const response = await fetch(url);
        if (!response.ok) return res.status(404).json({ error: "File not found in cloud" });
        const buffer = Buffer.from(await response.arrayBuffer());
        const downloadName = fileName || url.split("/").pop() || "download";
        res.setHeader("Content-Disposition", `attachment; filename="${downloadName}"`);
        const ext = path.extname(downloadName).toLowerCase();
        const knownMimeTypes: Record<string, string> = {
          ".pdf": "application/pdf", ".html": "text/html", ".htm": "text/html",
          ".css": "text/css", ".js": "application/javascript", ".sql": "text/plain",
          ".txt": "text/plain", ".py": "text/plain", ".vb": "text/plain",
          ".csv": "text/csv", ".json": "application/json", ".xml": "application/xml",
          ".zip": "application/zip", ".accdb": "application/msaccess", ".mdb": "application/msaccess",
          ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
          ".gif": "image/gif", ".webp": "image/webp",
        };
        res.setHeader("Content-Type", knownMimeTypes[ext] || "application/octet-stream");
        return res.send(buffer);
      } catch (err) {
        console.error("Cloud download proxy failed:", err);
        return res.status(500).json({ error: "Failed to download from cloud" });
      }
    }
    const cleanUrl = url.replace(/^\//, "");
    if (!cleanUrl.startsWith("resources/")) {
      return res.status(400).json({ error: "Invalid resource path" });
    }
    const filename = cleanUrl.replace(/^resources\//, "");
    const candidatePaths = [
      path.resolve(resourceUploadDir, filename),
      path.resolve(process.cwd(), "public", cleanUrl),
      path.resolve(process.cwd(), cleanUrl),
    ];
    let filePath: string | null = null;
    for (const candidate of candidatePaths) {
      if (candidate.includes("..")) continue;
      if (fs.existsSync(candidate)) {
        filePath = candidate;
        break;
      }
    }
    if (filePath) {
      const downloadName = fileName || path.basename(filePath);
      res.setHeader("Content-Disposition", `attachment; filename="${downloadName}"`);
      const ext = path.extname(downloadName).toLowerCase();
      const localMimeTypes: Record<string, string> = {
        ".pdf": "application/pdf", ".html": "text/html", ".htm": "text/html",
        ".css": "text/css", ".js": "application/javascript", ".sql": "text/plain",
        ".txt": "text/plain", ".py": "text/plain", ".vb": "text/plain",
        ".csv": "text/csv", ".json": "application/json", ".xml": "application/xml",
        ".zip": "application/zip", ".accdb": "application/msaccess", ".mdb": "application/msaccess",
        ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
        ".gif": "image/gif", ".webp": "image/webp",
      };
      res.setHeader("Content-Type", localMimeTypes[ext] || "application/octet-stream");
      return res.sendFile(filePath);
    }
    const cloudData = await downloadFromCloud(`resources/${filename}`);
    if (cloudData) {
      const downloadName = fileName || filename;
      res.setHeader("Content-Disposition", `attachment; filename="${downloadName}"`);
      const ext = path.extname(filename).toLowerCase();
      const mimeTypes: Record<string, string> = {
        ".pdf": "application/pdf", ".html": "text/html", ".htm": "text/html",
        ".css": "text/css", ".js": "application/javascript", ".sql": "text/plain",
        ".txt": "text/plain", ".py": "text/plain", ".vb": "text/plain",
        ".csv": "text/csv", ".json": "application/json", ".xml": "application/xml",
        ".zip": "application/zip", ".accdb": "application/msaccess", ".mdb": "application/msaccess",
        ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
        ".gif": "image/gif", ".webp": "image/webp",
      };
      res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream");
      return res.send(cloudData);
    }
    console.log(`Download failed - file not found locally or in cloud. Tried: ${candidatePaths.join(", ")}`);
    return res.status(404).json({ error: "File not found" });
  });

  // File upload endpoint (teacher-only)
  app.post("/api/upload", requireAuth, upload.single("file"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    await uploadToCloud(req.file.path, `assets/${req.file.filename}`);
    const url = `/assets/${req.file.filename}`;
    res.json({ url, filename: req.file.filename });
  });

  app.post("/api/upload-resource", requireAuth, resourceUpload.single("file"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    await uploadToCloud(req.file.path, `resources/${req.file.filename}`);
    const url = `/resources/${req.file.filename}`;
    res.json({ url, originalName: req.file.originalname });
  });

  const studentUploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { error: "Too many uploads, please try again later" },
    validate: false,
  });

  const studentUploadStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, resourceUploadDir),
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + "_" + Math.round(Math.random() * 1e9);
      cb(null, "student_" + uniqueSuffix + path.extname(file.originalname));
    }
  });

  const studentUpload = multer({
    storage: studentUploadStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const allowedExts = /\.(jpg|jpeg|png|gif|webp|pdf|txt|csv|sql|py|vb|html|htm|css|js|json|xml|accdb|mdb|zip)$/i;
      if (allowedExts.test(path.extname(file.originalname))) {
        cb(null, true);
      } else {
        cb(new Error("File type not allowed. Accepted: images, PDF, text, code, web files, databases, ZIP"));
      }
    }
  });

  app.post("/api/upload-student-file", studentUploadLimiter, studentUpload.single("file"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    await uploadToCloud(req.file.path, `resources/${req.file.filename}`);
    const url = `/resources/${req.file.filename}`;
    res.json({ url, originalName: req.file.originalname });
  });

  // Teacher login endpoint - accepts username OR email with password
  app.post("/api/teacher/login", async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: "Username/email and password required" });
    }

    if (typeof username !== "string" || typeof password !== "string" || username.length > 254 || password.length > 128) {
      return res.status(400).json({ message: "Invalid input" });
    }

    const loginKey = username.toLowerCase().trim();
    const failedRecord = failedLogins.get(loginKey);
    if (failedRecord && failedRecord.lockedUntil > Date.now()) {
      const minutesLeft = Math.ceil((failedRecord.lockedUntil - Date.now()) / 60000);
      return res.status(429).json({ message: `Account temporarily locked. Try again in ${minutesLeft} minute(s).` });
    }

    try {
      let user = await storage.getUserByUsername(username);
      if (!user && username.includes('@')) {
        user = await storage.getUserByEmail(username);
      }
      
      if (!user) {
        const record = failedLogins.get(loginKey) || { count: 0, lockedUntil: 0 };
        record.count++;
        if (record.count >= MAX_FAILED_ATTEMPTS) {
          record.lockedUntil = Date.now() + LOCKOUT_DURATION;
        }
        failedLogins.set(loginKey, record);
        return res.status(401).json({ message: "Invalid username/email or password" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      
      if (!isValid) {
        const record = failedLogins.get(loginKey) || { count: 0, lockedUntil: 0 };
        record.count++;
        if (record.count >= MAX_FAILED_ATTEMPTS) {
          record.lockedUntil = Date.now() + LOCKOUT_DURATION;
        }
        failedLogins.set(loginKey, record);
        return res.status(401).json({ message: "Invalid username/email or password" });
      }

      failedLogins.delete(loginKey);

      const sessionToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      if (db) {
        await db.delete(sessionsTable).where(eq(sessionsTable.userId, user.id));
        await db.insert(sessionsTable).values({
          token: sessionToken,
          userId: user.id,
          username: user.username,
          expiresAt,
        });
      }

      res.json({ 
        success: true, 
        token: sessionToken,
        expiresAt: expiresAt.getTime() 
      });
    } catch (error: any) {
      console.error("Login error:", error?.message || error);
      if (error?.message?.includes('connect') || error?.message?.includes('timeout')) {
        return res.status(503).json({ message: "Database connection issue. Please try again." });
      }
      res.status(500).json({ message: "Server error. Please try again." });
    }
  });

  // Verify session endpoint
  app.get("/api/teacher/verify", async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    try {
      if (!db) return res.status(503).json({ message: "Database unavailable" });
      const rows = await db.select().from(sessionsTable).where(eq(sessionsTable.token, token));
      const session = rows[0];
      
      if (!session || session.expiresAt < new Date()) {
        if (session) await db.delete(sessionsTable).where(eq(sessionsTable.token, token));
        return res.status(401).json({ message: "Invalid or expired token" });
      }

      res.json({ valid: true, username: session.username });
    } catch (err) {
      console.error("Verify error:", err);
      return res.status(500).json({ message: "Verification failed" });
    }
  });

  // Change password endpoint
  app.post("/api/teacher/change-password", requireAuth, async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "")!;
    const { oldPassword, newPassword } = req.body;

    try {
      const sessionRows = await db!.select().from(sessionsTable).where(eq(sessionsTable.token, token));
      const session = sessionRows[0];
      if (!session) return res.status(401).json({ message: "Session not found" });
      const user = await storage.getUser(session.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isValid = await bcrypt.compare(oldPassword, user.password);
      
      if (!isValid) {
        return res.status(401).json({ message: "Current password incorrect" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUserPassword(user.id, hashedPassword);

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get user email endpoint
  app.get("/api/teacher/email", requireAuth, async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "")!;

    try {
      const sessionRows = await db!.select().from(sessionsTable).where(eq(sessionsTable.token, token));
      const session = sessionRows[0];
      if (!session) return res.status(401).json({ message: "Session not found" });
      const user = await storage.getUser(session.userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ email: user.email || "" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Update user email endpoint
  app.post("/api/teacher/email", requireAuth, async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "")!;
    const { email } = req.body;

    try {
      const sessionRows = await db!.select().from(sessionsTable).where(eq(sessionsTable.token, token));
      const session = sessionRows[0];
      if (!session) return res.status(401).json({ message: "Session not found" });

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      await storage.updateUserEmail(session.userId, email);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Request password reset endpoint
  app.post("/api/teacher/forgot-password", async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }

    try {
      const user = await storage.getUserByEmail(email);
      
      // Always return success to prevent email enumeration attacks
      if (!user) {
        return res.json({ success: true, message: "If an account exists with this email, a reset link has been sent." });
      }

      // Generate secure token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      
      // Store token in database
      await storage.createPasswordResetToken(user.id, resetToken, expiresAt);
      
      const baseUrl = process.env.BASE_URL
        || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : null)
        || (process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : null)
        || 'http://localhost:5000';
      const resetLink = `${baseUrl}/teacher/reset-password/${resetToken}`;
      
      // Send email
      const emailSent = await sendPasswordResetEmail(email, resetLink, user.username);
      
      if (!emailSent) {
        console.error("Failed to send password reset email");
      }
      
      res.json({ success: true, message: "If an account exists with this email, a reset link has been sent." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Verify reset token endpoint
  app.get("/api/teacher/verify-reset-token", async (req, res) => {
    const { token } = req.query;
    
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ valid: false, message: "Token required" });
    }

    try {
      const resetToken = await storage.getPasswordResetToken(token);
      
      if (!resetToken) {
        return res.json({ valid: false, message: "Invalid or expired reset link" });
      }

      if (resetToken.usedAt) {
        return res.json({ valid: false, message: "This reset link has already been used" });
      }

      if (new Date(resetToken.expiresAt) < new Date()) {
        return res.json({ valid: false, message: "This reset link has expired" });
      }

      res.json({ valid: true });
    } catch (error) {
      res.status(500).json({ valid: false, message: "Server error" });
    }
  });

  // Reset password endpoint
  app.post("/api/teacher/reset-password", async (req, res) => {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    try {
      const resetToken = await storage.getPasswordResetToken(token);
      
      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired reset link" });
      }

      if (resetToken.usedAt) {
        return res.status(400).json({ message: "This reset link has already been used" });
      }

      if (new Date(resetToken.expiresAt) < new Date()) {
        return res.status(400).json({ message: "This reset link has expired" });
      }

      // Update password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUserPassword(resetToken.userId, hashedPassword);
      
      // Mark token as used
      await storage.markPasswordResetTokenUsed(token);

      res.json({ success: true, message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Logout endpoint
  app.post("/api/teacher/logout", async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    
    if (token && db) {
      try {
        await db.delete(sessionsTable).where(eq(sessionsTable.token, token));
      } catch (err) {
        console.error("Logout session cleanup error:", err);
      }
    }

    res.json({ success: true });
  });

  // AI-powered answer grading endpoint with caching for cost efficiency
  app.post("/api/grade-answer", async (req, res) => {
    try {
      const { studentAnswer, markingScheme, maxMarks, questionContext, aiGuidance, referenceFiles, studentUploadedFiles, erdModelAnswer, navModelAnswer } = req.body;

      if (process.env.NODE_ENV !== "production") {
        console.log("Grading request received, marks:", maxMarks);
      }

      if (!studentAnswer || !markingScheme || maxMarks === undefined) {
        return res.status(400).json({ 
          error: "Missing required fields: studentAnswer, markingScheme, maxMarks" 
        });
      }

      let referenceFileContents = "";
      const referenceImages: { base64: string; mimeType: string; name: string }[] = [];
      if (referenceFiles && Array.isArray(referenceFiles) && referenceFiles.length > 0) {
        const fileTexts: string[] = [];
        const publicDir = path.resolve(process.cwd(), "public");
        const imageExts: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp" };
        const textExts = [".py", ".txt", ".sql", ".css", ".html", ".htm", ".js", ".vb", ".csv", ".json", ".xml"];
        for (const rf of referenceFiles) {
          const url = typeof rf === "string" ? rf : rf.url;
          if (!url || typeof url !== "string") continue;
          const name = (typeof rf === "object" && rf.originalName) || path.basename(url);
          const cleanUrl = url.replace(/^\//, "");
          if (!cleanUrl.startsWith("resources/")) continue;
          const filePath = path.resolve(publicDir, cleanUrl);
          if (!filePath.startsWith(publicDir)) continue;
          const ext = path.extname(name).toLowerCase();
          const refFilename = cleanUrl.replace(/^resources\//, "");
          if (textExts.includes(ext)) {
            try {
              let content: string | null = null;
              if (fs.existsSync(filePath)) {
                content = fs.readFileSync(filePath, "utf-8");
              } else {
                const cloudData = await downloadFromCloud(`resources/${refFilename}`);
                if (cloudData) content = cloudData.toString("utf-8");
              }
              if (content) {
                fileTexts.push(`--- FILE: ${name} ---\n${content}\n--- END FILE ---`);
              }
            } catch (e) {
              console.log(`Could not read reference file ${name}:`, e);
            }
          } else if (imageExts[ext]) {
            try {
              let imageBuffer: Buffer | null = null;
              if (fs.existsSync(filePath)) {
                imageBuffer = fs.readFileSync(filePath);
              } else {
                imageBuffer = await downloadFromCloud(`resources/${refFilename}`);
              }
              if (imageBuffer) {
                const base64 = imageBuffer.toString("base64");
                referenceImages.push({ base64, mimeType: imageExts[ext], name });
                fileTexts.push(`[Reference image: ${name} - included as image for visual analysis]`);
              }
            } catch (e) {
              console.log(`Could not read reference image ${name}:`, e);
            }
          }
        }
        if (fileTexts.length > 0) {
          referenceFileContents = "\n\nTEACHER REFERENCE FILES (correct/model answers):\n" + fileTexts.join("\n\n");
        }
      }

      let studentCodeContents = "";
      const studentImages: { base64: string; mimeType: string; name: string }[] = [];
      if (studentUploadedFiles && Array.isArray(studentUploadedFiles) && studentUploadedFiles.length > 0) {
        const codeTexts: string[] = [];
        const publicDir2 = path.resolve(process.cwd(), "public");
        const codeExts = [".py", ".html", ".htm", ".css", ".js", ".sql", ".txt", ".vb", ".csv", ".json", ".xml"];
        const imageExts2: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp" };
        for (const sf of studentUploadedFiles) {
          const url = typeof sf === "string" ? sf : sf.url;
          if (!url || typeof url !== "string") continue;
          const name = (typeof sf === "object" && (sf.originalName || sf.name)) || path.basename(url);
          const cleanUrl = url.replace(/^\//, "");
          if (!cleanUrl.startsWith("resources/")) {
            console.log(`Student file skipped (path doesn't start with resources/): ${cleanUrl}`);
            continue;
          }
          const filePath = path.resolve(publicDir2, cleanUrl);
          if (!filePath.startsWith(publicDir2)) {
            console.log(`Student file skipped (path traversal): ${filePath}`);
            continue;
          }
          const ext = path.extname(name).toLowerCase();
          const filename = cleanUrl.replace(/^resources\//, "");
          if (codeExts.includes(ext)) {
            try {
              let content: string | null = null;
              if (fs.existsSync(filePath)) {
                content = fs.readFileSync(filePath, "utf-8");
                console.log(`Read student file from disk: ${name} (${content.length} chars)`);
              } else {
                const cloudData = await downloadFromCloud(`resources/${filename}`);
                if (cloudData) {
                  content = cloudData.toString("utf-8");
                  console.log(`Read student file from cloud: ${name} (${content.length} chars)`);
                }
              }
              if (content) {
                codeTexts.push(`--- STUDENT FILE: ${name} ---\n${content}\n--- END STUDENT FILE ---`);
              } else {
                console.log(`Student file not found locally or in cloud: ${name}`);
                codeTexts.push(`[Student uploaded file: ${name} — file could not be read, grade based on other available information]`);
              }
            } catch (e) {
              console.log(`Could not read student file ${name}:`, e);
            }
          } else if (imageExts2[ext]) {
            try {
              let imageBuffer: Buffer | null = null;
              if (fs.existsSync(filePath)) {
                imageBuffer = fs.readFileSync(filePath);
                console.log(`Read student image from disk: ${name}`);
              } else {
                imageBuffer = await downloadFromCloud(`resources/${filename}`);
                if (imageBuffer) console.log(`Read student image from cloud: ${name}`);
              }
              if (imageBuffer) {
                const base64 = imageBuffer.toString("base64");
                studentImages.push({ base64, mimeType: imageExts2[ext], name });
                codeTexts.push(`[Student uploaded image: ${name} - included for visual analysis]`);
              }
            } catch (e) {
              console.log(`Could not read student image ${name}:`, e);
            }
          } else {
            console.log(`Student file skipped (unsupported ext): ${name} (ext: ${ext})`);
          }
        }
        if (codeTexts.length > 0) {
          studentCodeContents = "\n\nSTUDENT'S UPLOADED FILE(S) — you MUST read and grade these:\n" + codeTexts.join("\n\n");
        }
      }

      // Check cache first to avoid duplicate API calls
      const cacheKey = hashGradingRequest(studentAnswer, markingScheme, maxMarks, aiGuidance + referenceFileContents + studentCodeContents + (erdModelAnswer || "") + (navModelAnswer || ""));
      const cached = gradingCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        console.log("Returning cached grading result");
        return res.json({
          marks: cached.marks,
          feedback: cached.feedback,
          suggestions: cached.suggestions
        });
      }

      // Condensed system prompt for cost efficiency
      const systemPrompt = `You are a Higher Computing Science exam marker. Grade fairly using the marking scheme.

RULES:
- Use "you" in feedback (not "the student")
- Award marks for equivalent concepts (different wording OK)
- Accept any valid programming syntax or pseudocode
- Be lenient with spelling/grammar
- For diagrams: focus on logic, not exact wording
- If TEACHER GUIDANCE is provided, use it as the source of correct answers
- For labeled fields (e.g., "fieldName: answer"), answers must match the correct field
- IMPORTANT: If the student earns FULL MARKS, set suggestions to empty string "" - they don't need to improve anything
- If the student uploaded code files (HTML, CSS, JS, Python, SQL, etc.), grade the FILE CONTENTS as their answer. The uploaded file IS their work — read it carefully and assess it against the marking scheme. Do NOT say "review manually" — you have the full file content available.

MARKING SCHEME FORMAT:
- Each line in the marking scheme represents 1 mark point
- Indented lines (starting with spaces/tabs followed by - or •) are ALTERNATIVE answers for the same mark
- Example marking scheme:
  "Correct use of WHILE loop" (1 mark)
    - Could also accept REPEAT UNTIL loop
    - Could also accept FOR loop with condition check
  "Variable initialised before loop" (1 mark)
- The student only needs to match ONE of the alternatives to earn that mark point
- Only award 1 mark per group (main point + its indented alternatives), not 1 mark per alternative

FEEDBACK LENGTH — scale feedback to the question's mark value (${maxMarks} marks):
- 1 mark: 1-2 short bullet points (1 sentence each max)
- 2 marks: 2-3 short bullet points
- 3-4 marks: 3-4 bullet points
- 5+ marks: up to 5-6 bullet points
- Keep each bullet point to ONE concise sentence
- Do NOT repeat the question or marking scheme back to the student
- Be direct — state what was correct or incorrect without lengthy explanation

FEEDBACK FORMATTING:
- Use "• " (bullet character) at the start of each point
- Each bullet should address one specific aspect of the answer

TECHNICAL FEEDBACK - USE SUBJECT-APPROPRIATE LANGUAGE:
- Read the question context to determine the topic area and use appropriate technical terminology
- For WEB DEVELOPMENT questions, use terms like: CSS selectors, specificity, inheritance, external/internal/inline stylesheets, relative/absolute file paths, HTML elements, attributes, properties, values, pixels, RGB/hex colour codes, responsive design, accessibility, semantic HTML, class selectors, ID selectors, cascading
- For DATABASE questions, use terms like: SQL queries, SELECT/FROM/WHERE/ORDER BY clauses, primary key, foreign key, entity-relationship diagrams, one-to-many relationships, data types (text, integer, real, boolean), validation, normalization
- For SOFTWARE DESIGN questions, use terms like: pseudocode, flowcharts, structure diagrams, conditional loops (WHILE/UNTIL), fixed loops (FOR), iteration, selection (IF/ELSE), input validation, concatenation, data types, variables, arrays, functions/procedures
- For COMPUTER SYSTEMS questions, use terms like: binary, ASCII/extended ASCII, floating-point representation (mantissa/exponent), bit depth, colour depth, resolution, compression (lossy/lossless), file size calculation, translators (compiler/interpreter)
- Provide educational feedback that helps students understand WHY their answer was correct/incorrect using proper technical vocabulary
- Reference specific concepts from the Higher Computing Science curriculum when explaining errors

ERD (ENTITY RELATIONSHIP DIAGRAM) GRADING:
- Crow's foot lines represent one-to-many relationships
- The FORKED END (crow's foot) represents the "MANY" side
- The PLAIN END (no fork) represents the "ONE" side  
- To determine direction: look at coordinates x1,y1 (start/ONE side) and x2,y2 (end/MANY side)
- If connectedTo1 links to Entity A and connectedTo2 links to Entity B, the relationship is: A (one) to B (many)
- Check the relationshipLabel property for the relationship name
- Example: A crow's foot line from "Customer" to "Order" with fork at Order means: one Customer has many Orders
- Award marks for correct direction - the forked end MUST point to the correct "many" entity

NAVIGATION DIAGRAM GRADING:
- Navigation diagrams show how web pages link to each other
- SINGLE ARROW (arrowEnd: true, arrowStart: false): Represents a ONE-WAY LINK or EXTERNAL LINK - user can navigate in one direction only
- DOUBLE ARROW (arrowEnd: true, arrowStart: true): Represents a TWO-WAY LINK or INTERNAL LINK - user can navigate back and forth between pages
- In feedback, use proper web terminology: "one-way link", "two-way link", "internal link", "external link", "navigation path", "hyperlink"
- Check if links connect the correct pages and use the appropriate arrow type for the relationship
- Home pages typically have two-way links to main sections, while external links (e.g., to social media) are one-way

FORM WIREFRAME GRADING:
- Form wireframe answers show form elements the student has drawn, serialized as a list
- The answer format is "FORM ELEMENTS (in order from top to bottom):" followed by each element on a new line
- Element types and their formats:
  - [LABEL: "text"] - A text label, may contain * to indicate required field
  - [TEXT INPUT for "label text"] - A single-line text input field, associated with a label
  - [TEXTAREA for "label text"] - A multi-line text area, associated with a label
  - [DROPDOWN for "label text" with option "option text"] - A dropdown/select box
  - [RADIO BUTTON: "option text"] - A radio button with its option label
  - [CHECKBOX: "option text"] - A checkbox with its label
  - [SUBMIT BUTTON: "button text"] - A form submission button
- REQUIRED field detection: Labels containing "*" in their text indicate required fields
  - Labels are marked as "(REQUIRED - has *)" when they contain an asterisk
  - The associated input/textarea/dropdown will show "REQUIRED" when its paired label has *
- VALIDATION RULES: Form inputs may include validation specifications
  - Format: VALIDATION: "validation message or rule"
  - Example: [TEXT INPUT for "Age*" REQUIRED VALIDATION: "must be between 1 and 14"]
  - When grading, check if the student has included appropriate validation rules for numeric inputs
  - Validation rules typically specify min/max values or acceptable formats
  - Give credit when validation rules are present and appropriate for the field type
- When grading form wireframes, check for:
  - Correct form elements (inputs, textareas, dropdowns, radio buttons, checkboxes)
  - Labels with appropriate text
  - Required field markers (*) where specified
  - Validation rules for fields that require data validation (e.g., numeric ranges)
  - Presence of a submit button
  - Radio buttons/checkboxes with correct options
- Be lenient with exact label text - focus on whether the correct TYPE of element is present

GENERAL DIAGRAM GRADING (flowcharts, structure diagrams, etc.):
- Student diagram answers are serialized as lists of SHAPES and CONNECTIONS
- Shape format: [TYPE at approx (x, y), size: WxH: "content"] where TYPE is BOX, ELLIPSE, DIAMOND, PARALLELOGRAM, etc.
- Connection format: [LINE from "shape A" to "shape B", arrow-end] or [DATAFLOW-UP from "function", label: "data"]
- Items marked [base] are teacher-provided starting shapes that the student cannot delete
- CHECK SHAPE TYPES: Verify students used the correct shape type for the diagram convention
- CHECK APPROXIMATE POSITIONS: Use (x, y) coordinates to verify layout makes sense
- CHECK CONNECTIONS: Verify lines/arrows connect the correct shapes in the right direction
- For DATAFLOW arrows: verify data flows in the correct direction with correct labels
- Compare against the marking scheme's expected objects, positions, and connections
- Be lenient with exact positioning but check relative layout

WEBPAGE WIREFRAME GRADING:
- Webpage wireframe answers show UI elements the student has placed, serialized as a list
- The answer format includes element type, position, size, and content
- Element types and their formats:
  - [HEADING at (x,y) size WxH: "text"] - A heading element
  - [PARAGRAPH at (x,y) size WxH: "text"] - A paragraph element
  - [IMAGE at (x,y) size WxH: "alt text"] - An image placeholder
  - [LINK at (x,y) size WxH: "link text"] - A hyperlink
  - [AUDIO PLAYER at (x,y) size WxH] - An audio player element
  - [VIDEO PLAYER at (x,y) size WxH] - A video player element
  - [CONTAINER/DIV at (x,y) size WxH: "content"] - A div/container element
  - [LABEL at (x,y) size WxH: "text"] - A label element
  - [BULLET LIST at (x,y) size WxH: "items"] - A bulleted list
  - [ANNOTATION at (x,y) size WxH: "note"] - An annotation/comment
- When grading webpage wireframes, check for:
  - Correct element types used (headings, paragraphs, images, links, etc.)
  - Vertical ordering of elements (top-to-bottom layout)
  - Appropriate content/labels for each element
  - Required elements as specified in the marking scheme
- Be lenient with exact positioning but verify the overall page structure and element order

DIAGRAM TEXT FORMATTING:
- Look for these properties in diagram items to understand text formatting:
  - isBold: true means the text is bold
  - isUnderline: true means the text is underlined  
  - hasBullet: true means the text has a bullet point
  - fontSize: "small", "normal", "large", or "xlarge" indicates text size
- When marking schemes mention text formatting (bold, size, underline), check these properties
- UNORDERED LIST (bullet points): Look for [BULLET_LIST: X bullet points: ...]
  - These are UNORDERED lists with bullet points (•)
  - Example: "[BULLET_LIST: 3 bullet points: 1. "Item A", 2. "Item B", 3. "Item C"]"
  - When a question asks for an unordered/bulleted list, verify this format is used
- ORDERED LIST (numbered): Look for [NUMBERED_LIST: X numbered items: ...]
  - These are ORDERED lists with numbers (1. 2. 3.)
  - Example: "[NUMBERED_LIST: 3 numbered items: 1. "Step one", 2. "Step two", 3. "Step three"]"
  - When a question asks for an ordered/numbered list, verify this format is used
- If a question specifies ordered vs unordered list, check that the correct type was used

PSEUDOCODE RECOGNITION - BE VERY LENIENT:
- Pseudocode has NO strict syntax rules - accept ANY reasonable variation
- Recognize equivalent input statements (all mean "get user input"):
  - GET/RECEIVE/INPUT/READ/ENTER variable FROM KEYBOARD
  - SET variable TO (INPUT)
- Recognize equivalent output statements:
  - SEND/DISPLAY/OUTPUT/PRINT "text" TO DISPLAY
- Accept flexible conditional/loop syntax:
  - "WHILE vote NOT (A OR B OR C OR D)" is valid
  - "WHILE vote <> A AND vote <> B" is equivalent
  - "WHILE NOT (vote = A OR vote = B)" is equivalent
  - Accept any logical expression that conveys the same meaning
- Accept flexible operators: NOT, <>, !=, AND, OR, &&, ||
- Parentheses can be placed flexibly - focus on the LOGIC being correct
- Variable names and exact wording don't matter - focus on the algorithm's correctness
- Accept both "=" and "==" for comparison in pseudocode

PYTHON CODE GRADING - ACCEPT VALID VARIATIONS:
- Variable and subprogram names do NOT need to match the marking scheme — any meaningful name is acceptable
- Award marks based on WHAT the code does, not HOW it looks
- Accept ALL valid approaches that achieve the same result, including but not limited to:
  - Data structures: list with .append(), pre-sized array with index assignment, list comprehension, dictionary of lists, named tuples, dataclasses, or plain classes
  - File reading: open()/read()/readlines(), csv.reader(), csv.DictReader(), pandas.read_csv(), with statement or manual close
  - Loops: for loop, while loop, for with enumerate(), for with range(len()), list comprehension, generator expression
  - Searching: linear search with for/while, using .index(), using next() with generator, using list comprehension with [0], using filter()
  - Finding min/max: manual tracking variable, min()/max() built-in, sorted()[0], using key parameter
  - String formatting: f-strings, .format(), % formatting, string concatenation
  - Conditionals: if/elif/else chains, match/case, dictionary lookup
  - Functions: def with return, def with print, lambda expressions
  - Counting/aggregation: manual counter variable, .count(), collections.Counter, sum() with generator
- If the teacher guidance lists specific accepted alternatives, accept ALL of them plus any other logically equivalent approach
- For multi-mark code questions, award partial marks for partially correct solutions — e.g., correct loop structure but wrong condition still earns the loop mark
- Indentation style, blank lines, and comment presence/absence should NOT affect marks
- Accept both single and double quotes for strings
- Accept both snake_case and camelCase naming conventions

CODE ANALYSIS - BE VERY CAREFUL:
- When checking SQL, Python, or HTML code, COUNT each element carefully
- For SQL INSERT: count EACH value in the VALUES(...) clause individually by looking at commas
- For SQL SELECT: count EACH field listed after SELECT
- For Python: count function arguments, list items, etc. one by one
- Do NOT guess or estimate - actually count the elements in the code
- Read the entire code snippet before making any claims about what it contains or doesn't contain

SQL QUESTIONS - BE STRICT:
- Column names MUST match exactly what is specified in the marking scheme or teacher guidance
- "contractCode" is NOT the same as "storage" - these are different columns
- ORDER BY must use the EXACT column names specified in the correct answer
- ASC/DESC must match the required sort direction
- Do NOT award marks for incorrect column names, even if the syntax is correct
- Check each column name character by character against the expected answer

IMPORTANT: Only award WHOLE marks (integers). Never give half marks or decimal marks (e.g. 1.5, 2.5). Round down if unsure.

Keep "suggestions" brief — 1-2 short sentences max pointing to what to revise. Empty string if full marks.

Return JSON: {"marks": number, "feedback": "string", "suggestions": "string (empty if full marks)"}`;

      let erdContext = "";
      if (erdModelAnswer) {
        erdContext = `\nERD MODEL ANSWER (correct diagram as JSON):\n${erdModelAnswer}\nCompare the student's ERD diagram items against this model answer. Check entity names, attributes, relationships (1:1, 1:M, M:M), and correct use of primary/foreign keys.\n`;
      }

      if (navModelAnswer) {
        erdContext += `\nNAVIGATION DIAGRAM MODEL ANSWER (correct diagram as JSON):\n${navModelAnswer}\nCompare the student's navigation diagram against this model answer. Check page names, link types (one-way vs two-way), and correct connections between pages.\n`;
      }

      const userPrompt = `Question: ${questionContext || "N/A"}

Marking Scheme (${maxMarks} marks):
${Array.isArray(markingScheme) ? markingScheme.join('\n') : markingScheme}
${aiGuidance ? `\nTEACHER GUIDANCE (correct answers):\n${aiGuidance}` : ''}${erdContext}${referenceFileContents}${studentCodeContents}

Student Answer:
${studentAnswer}`;

      let responseText: string | undefined;
      let usedProvider = "unknown";

      // Try Gemini first (primary), fall back to Groq if it fails
      if (gemini) {
        try {
          console.log("Attempting grading with Gemini...");
          let geminiContents: any;
          const allImages = [...referenceImages, ...studentImages];
          if (allImages.length > 0) {
            const parts: any[] = [
              { text: `${systemPrompt}\n\n${userPrompt}` }
            ];
            for (const img of referenceImages) {
              parts.push({ text: `\n[Teacher reference image: ${img.name}]` });
              parts.push({ inlineData: { data: img.base64, mimeType: img.mimeType } });
            }
            if (referenceImages.length > 0) {
              parts.push({ text: "\nUse the reference images above to help grade the student's answer. These show expected output, correct code, or other visual references from the teacher." });
            }
            for (const img of studentImages) {
              parts.push({ text: `\n[Student uploaded image: ${img.name}]` });
              parts.push({ inlineData: { data: img.base64, mimeType: img.mimeType } });
            }
            if (studentImages.length > 0) {
              parts.push({ text: "\nThe images above were uploaded by the student as part of their answer. Grade them accordingly." });
            }
            geminiContents = parts;
          } else {
            geminiContents = `${systemPrompt}\n\n${userPrompt}`;
          }
          const geminiResponse = await gemini.models.generateContent({
            model: "gemini-2.5-flash",
            contents: geminiContents,
            config: {
              responseMimeType: "application/json",
              thinkingConfig: { thinkingBudget: 0 }
            }
          });
          responseText = geminiResponse.text;
          usedProvider = "gemini";
          console.log("Grading completed with Gemini" + (referenceImages.length > 0 ? ` (with ${referenceImages.length} reference image${referenceImages.length !== 1 ? "s" : ""})` : ""));
        } catch (geminiError: any) {
          console.log("Gemini failed, falling back to Groq:", geminiError?.message || geminiError);
        }
      }

      // Fallback to Groq if Gemini failed or not available
      if (!responseText) {
        console.log("Using Groq for grading...");
        const groqResponse = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          response_format: { type: "json_object" }
        });
        responseText = groqResponse.choices[0]?.message?.content || undefined;
        usedProvider = "groq";
        console.log("Grading completed with Groq");
      }

      if (!responseText) {
        throw new Error("No response from AI");
      }

      if (process.env.NODE_ENV !== "production") {
        console.log("AI response received, parsing...");
      }
      
      const result = JSON.parse(responseText);

      const parsedMarks = Math.floor(Number(result.marks));
      if (isNaN(parsedMarks) || parsedMarks < 0 || parsedMarks > maxMarks) {
        throw new Error("Invalid marks in AI response");
      }

      const gotFullMarks = parsedMarks >= maxMarks;
      
      const gradingResult = {
        marks: parsedMarks,
        feedback: result.feedback || "",
        suggestions: gotFullMarks ? "" : (result.suggestions || "")
      };

      // Cache the result
      gradingCache.set(cacheKey, { ...gradingResult, timestamp: Date.now() });

      res.json(gradingResult);

    } catch (error) {
      console.error("AI grading error:", error);
      res.status(500).json({ 
        error: "Failed to grade answer",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Questions API endpoints
  app.get("/api/questions", async (req, res) => {
    try {
      let allQuestions = await storage.getAllQuestions();
      const forExamPaper = req.query.forExamPaper as string | undefined;

      if (forExamPaper === "all") {
        const teacherToken = req.headers.authorization?.replace("Bearer ", "");
        if (teacherToken && db) {
          const rows = await db.select().from(sessionsTable).where(eq(sessionsTable.token, teacherToken));
          if (rows[0] && rows[0].expiresAt >= new Date()) {
            res.json(allQuestions);
            return;
          }
        }
      }

      const authHeader = req.headers.authorization;
      let studentSession: any = null;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        try {
          studentSession = await storage.getStudentSession(token);
        } catch (e) {}
      }

      if (studentSession) {
        const completedPaperIds = await storage.getStudentCompletedAdditionalPaperIds(studentSession.studentId);
        allQuestions = allQuestions.filter(q => {
          if (q.isAdditionalExam && q.additionalExamId) {
            return completedPaperIds.includes(q.additionalExamId);
          }
          return true;
        });
      } else {
        allQuestions = allQuestions.filter(q => !q.isAdditionalExam);
      }

      res.json(allQuestions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  });

  app.get("/api/questions/:id", async (req, res) => {
    try {
      const question = await storage.getQuestion(req.params.id);
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }
      res.json(question);
    } catch (error) {
      console.error("Error fetching question:", error);
      res.status(500).json({ error: "Failed to fetch question" });
    }
  });

  app.post("/api/questions", requireAuth, async (req, res) => {
    try {
      const question = await storage.createQuestion(req.body);
      res.status(201).json(question);
    } catch (error) {
      console.error("Error creating question:", error);
      res.status(500).json({ error: "Failed to create question" });
    }
  });

  app.put("/api/questions/:id", requireAuth, async (req, res) => {
    try {
      const question = await storage.updateQuestion({ ...req.body, id: req.params.id });
      res.json(question);
    } catch (error) {
      console.error("Error updating question:", error);
      res.status(500).json({ error: "Failed to update question" });
    }
  });

  app.delete("/api/questions/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteQuestion(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting question:", error);
      res.status(500).json({ error: "Failed to delete question" });
    }
  });

  // Seed questions endpoint (accepts array of questions to seed)
  app.post("/api/questions/seed", requireAuth, async (req, res) => {
    try {
      const existingQuestions = await storage.getAllQuestions();
      const existingIds = new Set(existingQuestions.map(q => q.id));

      const questionsToSeed = req.body;
      if (!Array.isArray(questionsToSeed)) {
        return res.status(400).json({ error: "Expected array of questions" });
      }

      let added = 0;
      for (const q of questionsToSeed) {
        if (!existingIds.has(q.id)) {
          await storage.createQuestion(q);
          added++;
        }
      }

      res.json({ success: true, added, existing: existingQuestions.length });
    } catch (error) {
      console.error("Error seeding questions:", error);
      res.status(500).json({ error: "Failed to seed questions" });
    }
  });

  // ==================== CUSTOM QUIZZES API ====================

  app.get("/api/custom-quizzes", async (_req, res) => {
    try {
      const quizzes = await storage.listCustomQuizzes();
      res.json(quizzes);
    } catch (error) {
      console.error("Error listing quizzes:", error);
      res.status(500).json({ error: "Failed to list quizzes" });
    }
  });

  app.get("/api/custom-quizzes/:id", async (req, res) => {
    try {
      const quiz = await storage.getCustomQuiz(req.params.id);
      if (!quiz) return res.status(404).json({ error: "Quiz not found" });
      res.json(quiz);
    } catch (error) {
      console.error("Error fetching quiz:", error);
      res.status(500).json({ error: "Failed to fetch quiz" });
    }
  });

  app.post("/api/custom-quizzes", requireAuth, async (req, res) => {
    try {
      const quiz = await storage.createCustomQuiz(req.body);
      res.status(201).json(quiz);
    } catch (error) {
      console.error("Error creating quiz:", error);
      res.status(500).json({ error: "Failed to create quiz" });
    }
  });

  app.put("/api/custom-quizzes/:id", requireAuth, async (req, res) => {
    try {
      const quiz = await storage.updateCustomQuiz(req.params.id, req.body);
      res.json(quiz);
    } catch (error) {
      console.error("Error updating quiz:", error);
      res.status(500).json({ error: "Failed to update quiz" });
    }
  });

  app.delete("/api/custom-quizzes/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteCustomQuiz(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting quiz:", error);
      res.status(500).json({ error: "Failed to delete quiz" });
    }
  });

  // ==================== ADDITIONAL EXAMS API ====================

  app.get("/api/additional-exams", async (_req, res) => {
    try {
      const list = await storage.listAdditionalExams();
      res.json(list);
    } catch (error) {
      console.error("Error listing additional exams:", error);
      res.status(500).json({ error: "Failed to list additional exams" });
    }
  });

  app.get("/api/additional-exams/published", async (_req, res) => {
    try {
      const list = await storage.listAdditionalExams();
      res.json(list.filter(e => e.isPublished));
    } catch (error) {
      console.error("Error listing published additional exams:", error);
      res.status(500).json({ error: "Failed to list published additional exams" });
    }
  });

  app.get("/api/additional-exams/:id", async (req, res) => {
    try {
      const exam = await storage.getAdditionalExam(req.params.id);
      if (!exam) return res.status(404).json({ error: "Not found" });
      res.json(exam);
    } catch (error) {
      console.error("Error getting additional exam:", error);
      res.status(500).json({ error: "Failed to get additional exam" });
    }
  });

  app.post("/api/additional-exams", requireAuth, async (req, res) => {
    try {
      const { title } = req.body;
      if (!title) return res.status(400).json({ error: "Title is required" });
      const exam = await storage.createAdditionalExam({ title });
      res.json(exam);
    } catch (error) {
      console.error("Error creating additional exam:", error);
      res.status(500).json({ error: "Failed to create additional exam" });
    }
  });

  app.patch("/api/additional-exams/:id", requireAuth, async (req, res) => {
    try {
      const exam = await storage.updateAdditionalExam(req.params.id, req.body);
      res.json(exam);
    } catch (error) {
      console.error("Error updating additional exam:", error);
      res.status(500).json({ error: "Failed to update additional exam" });
    }
  });

  app.post("/api/additional-exams/:id/publish", requireAuth, async (req, res) => {
    try {
      const exam = await storage.updateAdditionalExam(req.params.id, { isPublished: true });
      res.json(exam);
    } catch (error) {
      console.error("Error publishing additional exam:", error);
      res.status(500).json({ error: "Failed to publish additional exam" });
    }
  });

  app.post("/api/additional-exams/:id/unpublish", requireAuth, async (req, res) => {
    try {
      const exam = await storage.updateAdditionalExam(req.params.id, { isPublished: false });
      res.json(exam);
    } catch (error) {
      console.error("Error unpublishing additional exam:", error);
      res.status(500).json({ error: "Failed to unpublish additional exam" });
    }
  });

  app.delete("/api/additional-exams/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteAdditionalExam(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting additional exam:", error);
      res.status(500).json({ error: "Failed to delete additional exam" });
    }
  });

  app.get("/api/additional-exams/:id/questions", async (req, res) => {
    try {
      const allQuestions = await storage.getAllQuestions();
      const filtered = allQuestions.filter((q: any) => q.additionalExamId === req.params.id);
      res.json(filtered);
    } catch (error) {
      console.error("Error getting additional exam questions:", error);
      res.status(500).json({ error: "Failed to get questions" });
    }
  });

  // ==================== ASSIGNMENTS API ====================

  app.get("/api/assignments/published", async (_req, res) => {
    try {
      const list = await storage.listAssignments();
      const published = list.filter(a => a.isPublished);
      res.json(published);
    } catch (error) {
      console.error("Error listing published assignments:", error);
      res.status(500).json({ error: "Failed to list published assignments" });
    }
  });

  app.get("/api/assignments", async (_req, res) => {
    try {
      const list = await storage.listAssignments();
      res.json(list);
    } catch (error) {
      console.error("Error listing assignments:", error);
      res.status(500).json({ error: "Failed to list assignments" });
    }
  });

  app.get("/api/assignments/all-full", async (_req, res) => {
    try {
      const list = await storage.listAllAssignmentsFull();
      res.json(list);
    } catch (error) {
      console.error("Error listing full assignments:", error);
      res.status(500).json({ error: "Failed to list assignments" });
    }
  });

  app.get("/api/assignments/:id", async (req, res) => {
    try {
      const assignment = await storage.getAssignment(req.params.id);
      if (!assignment) return res.status(404).json({ error: "Assignment not found" });
      res.json(assignment);
    } catch (error) {
      console.error("Error fetching assignment:", error);
      res.status(500).json({ error: "Failed to fetch assignment" });
    }
  });

  app.get("/api/assignments/:id/full", async (req, res) => {
    try {
      const full = await storage.getFullAssignment(req.params.id);
      if (!full) return res.status(404).json({ error: "Assignment not found" });
      res.json(full);
    } catch (error) {
      console.error("Error fetching full assignment:", error);
      res.status(500).json({ error: "Failed to fetch assignment" });
    }
  });

  app.post("/api/assignments", requireAuth, async (req, res) => {
    try {
      const assignment = await storage.createAssignment(req.body);
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error creating assignment:", error);
      res.status(500).json({ error: "Failed to create assignment" });
    }
  });

  app.put("/api/assignments/:id", requireAuth, async (req, res) => {
    try {
      const assignment = await storage.updateAssignment(req.params.id, req.body);
      res.json(assignment);
    } catch (error) {
      console.error("Error updating assignment:", error);
      res.status(500).json({ error: "Failed to update assignment" });
    }
  });

  app.patch("/api/assignments/:id", requireAuth, async (req, res) => {
    try {
      const assignment = await storage.updateAssignment(req.params.id, req.body);
      res.json(assignment);
    } catch (error) {
      console.error("Error patching assignment:", error);
      res.status(500).json({ error: "Failed to patch assignment" });
    }
  });

  app.delete("/api/assignments/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteAssignment(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting assignment:", error);
      res.status(500).json({ error: "Failed to delete assignment" });
    }
  });

  // ==================== ASSIGNMENT SECTIONS API ====================

  app.get("/api/assignments/:assignmentId/sections", async (req, res) => {
    try {
      const sections = await storage.listAssignmentSections(req.params.assignmentId);
      res.json(sections);
    } catch (error) {
      console.error("Error listing sections:", error);
      res.status(500).json({ error: "Failed to list sections" });
    }
  });

  app.post("/api/assignment-sections", requireAuth, async (req, res) => {
    try {
      const section = await storage.createAssignmentSection(req.body);
      res.status(201).json(section);
    } catch (error) {
      console.error("Error creating section:", error);
      res.status(500).json({ error: "Failed to create section" });
    }
  });

  app.put("/api/assignment-sections/:id", requireAuth, async (req, res) => {
    try {
      const section = await storage.updateAssignmentSection(req.params.id, req.body);
      res.json(section);
    } catch (error) {
      console.error("Error updating section:", error);
      res.status(500).json({ error: "Failed to update section" });
    }
  });

  app.patch("/api/assignment-sections/:id", requireAuth, async (req, res) => {
    try {
      const section = await storage.updateAssignmentSection(req.params.id, req.body);
      res.json(section);
    } catch (error) {
      console.error("Error patching section:", error);
      res.status(500).json({ error: "Failed to patch section" });
    }
  });

  app.delete("/api/assignment-sections/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteAssignmentSection(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting section:", error);
      res.status(500).json({ error: "Failed to delete section" });
    }
  });

  // ==================== ASSIGNMENT PARTS API ====================

  app.get("/api/assignment-sections/:sectionId/parts", async (req, res) => {
    try {
      const parts = await storage.listAssignmentParts(req.params.sectionId);
      res.json(parts);
    } catch (error) {
      console.error("Error listing parts:", error);
      res.status(500).json({ error: "Failed to list parts" });
    }
  });

  app.post("/api/assignment-parts", requireAuth, async (req, res) => {
    try {
      const part = await storage.createAssignmentPart(req.body);
      res.status(201).json(part);
    } catch (error) {
      console.error("Error creating part:", error);
      res.status(500).json({ error: "Failed to create part" });
    }
  });

  app.put("/api/assignment-parts/:id", requireAuth, async (req, res) => {
    try {
      const part = await storage.updateAssignmentPart(req.params.id, req.body);
      res.json(part);
    } catch (error) {
      console.error("Error updating part:", error);
      res.status(500).json({ error: "Failed to update part" });
    }
  });

  app.delete("/api/assignment-parts/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteAssignmentPart(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting part:", error);
      res.status(500).json({ error: "Failed to delete part" });
    }
  });

  // ==================== ASSIGNMENT RESOURCES API ====================

  app.get("/api/assignment-parts/:partId/resources", async (req, res) => {
    try {
      const resources = await storage.listAssignmentResources(req.params.partId);
      res.json(resources);
    } catch (error) {
      console.error("Error listing resources:", error);
      res.status(500).json({ error: "Failed to list resources" });
    }
  });

  app.post("/api/assignment-resources", requireAuth, async (req, res) => {
    try {
      const resource = await storage.createAssignmentResource(req.body);
      res.status(201).json(resource);
    } catch (error) {
      console.error("Error creating resource:", error);
      res.status(500).json({ error: "Failed to create resource" });
    }
  });

  app.post("/api/assignment-parts/:partId/resources", requireAuth, resourceUpload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      await uploadToCloud(req.file.path, `resources/${req.file.filename}`);
      const fileUrl = `/resources/${req.file.filename}`;
      const resource = await storage.createAssignmentResource({
        partId: req.params.partId,
        fileName: req.file.originalname,
        fileUrl,
        fileType: path.extname(req.file.originalname).toLowerCase(),
        description: req.body.description || null,
      });
      res.status(201).json(resource);
    } catch (error) {
      console.error("Error uploading resource:", error);
      res.status(500).json({ error: "Failed to upload resource" });
    }
  });

  app.delete("/api/assignment-resources/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteAssignmentResource(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting resource:", error);
      res.status(500).json({ error: "Failed to delete resource" });
    }
  });

  // ==================== ASSIGNMENT ATTEMPTS API ====================

  app.get("/api/assignments/:assignmentId/attempts", async (req, res) => {
    try {
      const attempts = await storage.listAssignmentAttempts(req.params.assignmentId);
      res.json(attempts);
    } catch (error) {
      console.error("Error listing attempts:", error);
      res.status(500).json({ error: "Failed to list attempts" });
    }
  });

  app.get("/api/assignment-attempts/:id", async (req, res) => {
    try {
      const attempt = await storage.getAssignmentAttempt(req.params.id);
      if (!attempt) return res.status(404).json({ error: "Attempt not found" });
      res.json(attempt);
    } catch (error) {
      console.error("Error fetching attempt:", error);
      res.status(500).json({ error: "Failed to fetch attempt" });
    }
  });

  app.post("/api/assignment-attempts", async (req, res) => {
    try {
      const attempt = await storage.createAssignmentAttempt(req.body);
      res.status(201).json(attempt);
    } catch (error) {
      console.error("Error creating attempt:", error);
      res.status(500).json({ error: "Failed to create attempt" });
    }
  });

  app.put("/api/assignment-attempts/:id", async (req, res) => {
    try {
      const attempt = await storage.updateAssignmentAttempt(req.params.id, req.body);
      res.json(attempt);
    } catch (error) {
      console.error("Error updating attempt:", error);
      res.status(500).json({ error: "Failed to update attempt" });
    }
  });

  // ==================== STUDENT ASSIGNMENT SYNC API ====================

  app.delete("/api/student/assignment-attempt/:assignmentId", requireStudentAuth, async (req, res) => {
    try {
      const studentId = (req as any).studentId;
      const attempt = await storage.getAssignmentAttemptByStudent(req.params.assignmentId, studentId);
      if (attempt && attempt.status !== "completed") {
        await storage.deleteAssignmentAttempt(attempt.id);
      }
      res.json({ ok: true });
    } catch (error) {
      console.error("Error deleting assignment attempt:", error);
      res.status(500).json({ error: "Failed to delete attempt" });
    }
  });

  app.post("/api/student/assignment-sync", requireStudentAuth, async (req, res) => {
    try {
      const studentId = (req as any).studentId;
      const { assignmentId, chosenOptionalSection, elapsedMs, totalMs, answers, completedParts, gradingResults, freshStart } = req.body;
      if (!assignmentId) return res.status(400).json({ error: "assignmentId required" });

      let attempt = await storage.getAssignmentAttemptByStudent(assignmentId, studentId);
      const timeRemaining = Math.max(0, Math.floor(((totalMs || 0) - (elapsedMs || 0)) / 1000));
      const completedPartsList = completedParts ? Object.values(completedParts).flat() as string[] : [];
      const newStatus = gradingResults ? "completed" : "in_progress";

      if (freshStart && attempt && attempt.status !== "completed") {
        await storage.deleteAssignmentAttempt(attempt.id);
        attempt = undefined as any;
      }

      if (!attempt) {
        attempt = await storage.createAssignmentAttempt({
          assignmentId,
          localStudentId: studentId,
          chosenOptionalSection: chosenOptionalSection || "none",
          timeRemainingSeconds: timeRemaining,
          status: newStatus,
          completedPartIds: completedPartsList,
        });
      } else {
        const safeStatus = attempt.status === "completed" ? "completed" : newStatus;
        const existingParts = attempt.completedPartIds || [];
        const mergedParts = [...new Set([...existingParts, ...completedPartsList])];
        const safeTimeRemaining = Math.min(timeRemaining, attempt.timeRemainingSeconds ?? Infinity);
        attempt = await storage.updateAssignmentAttempt(attempt.id, {
          timeRemainingSeconds: safeTimeRemaining,
          status: safeStatus,
          completedPartIds: mergedParts,
          completedAt: gradingResults ? new Date() : undefined,
          chosenOptionalSection: chosenOptionalSection || attempt.chosenOptionalSection,
        });
      }

      if (answers && Object.keys(answers).length > 0) {
        const existingResponses = await storage.listAssignmentResponses(attempt.id);
        const existingByPart = new Map(existingResponses.map(r => [r.partId, r]));

        for (const [questionId, answer] of Object.entries(answers)) {
          const ans = answer as { text?: string; uploadedFiles?: { url: string; originalName: string }[] };
          const existing = existingByPart.get(questionId);
          if (existing) {
            await storage.updateAssignmentResponse(existing.id, {
              textAnswer: ans.text || null,
              screenshotUrls: ans.uploadedFiles?.map(f => f.url) || [],
            });
          } else {
            await storage.createAssignmentResponse({
              attemptId: attempt.id,
              partId: questionId,
              textAnswer: ans.text || null,
              screenshotUrls: ans.uploadedFiles?.map(f => f.url) || [],
            });
          }
        }
      }

      if (gradingResults && Array.isArray(gradingResults)) {
        const existingResponses = await storage.listAssignmentResponses(attempt.id);
        const existingByPart = new Map(existingResponses.map(r => [r.partId, r]));

        for (const result of gradingResults) {
          const partKey = result.questionId || `${result.sectionName}||${result.partLabel}||${result.questionLabel}`;
          const existing = existingByPart.get(partKey) || existingByPart.get(result.questionLabel);
          if (existing) {
            await storage.updateAssignmentResponse(existing.id, {
              marksAwarded: result.score,
              aiFeedback: `${result.feedback}\n\nSuggestions: ${result.suggestions}`,
            });
          } else {
            await storage.createAssignmentResponse({
              attemptId: attempt.id,
              partId: partKey,
              textAnswer: result.userAnswer || null,
              marksAwarded: result.score,
              aiFeedback: `${result.feedback}\n\nSuggestions: ${result.suggestions}`,
            });
          }
        }

        const totalScore = gradingResults.reduce((s: number, r: any) => s + (r.score || 0), 0);
        const maxMarks = gradingResults.reduce((s: number, r: any) => s + (r.maxMarks || 0), 0);
        const percentage = maxMarks > 0 ? Math.round((totalScore / maxMarks) * 100) : 0;

        const assignment = await storage.getAssignment(assignmentId);
        await storage.saveStudentExamResult({
          studentId,
          examType: "assignment",
          examIdentifier: assignmentId,
          examTitle: assignment?.title || "Assignment",
          score: totalScore,
          maxMarks,
          percentage,
          timeSpentSeconds: Math.floor((elapsedMs || 0) / 1000),
          answers: gradingResults,
        });
      }

      res.json({ attemptId: attempt.id, status: attempt.status });
    } catch (error) {
      console.error("Assignment sync error:", error);
      res.status(500).json({ error: "Failed to sync assignment" });
    }
  });

  app.get("/api/student/assignment-progress/:assignmentId", requireStudentAuth, async (req, res) => {
    try {
      const studentId = (req as any).studentId;
      const attempt = await storage.getAssignmentAttemptByStudent(req.params.assignmentId, studentId);
      if (!attempt) return res.json({ found: false });
      const responses = await storage.listAssignmentResponses(attempt.id);
      const answers: Record<string, { text: string; uploadedFiles: { url: string; originalName: string }[] }> = {};
      for (const r of responses) {
        answers[r.partId] = {
          text: r.textAnswer || "",
          uploadedFiles: (r.screenshotUrls || []).map(url => ({ url, originalName: url.split("/").pop() || "file" })),
        };
      }
      const assignment = await storage.getAssignment(req.params.assignmentId);
      const totalMs = (assignment?.totalTimeMinutes ?? 360) * 60 * 1000;
      const elapsedMs = totalMs - (attempt.timeRemainingSeconds || 0) * 1000;
      res.json({
        found: true,
        chosenOptionalSection: attempt.chosenOptionalSection,
        completedParts: attempt.completedPartIds || [],
        elapsedMs: Math.max(0, elapsedMs),
        timeRemainingSeconds: attempt.timeRemainingSeconds,
        answers,
        status: attempt.status,
      });
    } catch (error) {
      console.error("Get assignment progress error:", error);
      res.status(500).json({ error: "Failed to get progress" });
    }
  });

  app.get("/api/teacher/assignment-submissions/:assignmentId", requireAuth, async (req, res) => {
    try {
      const attempts = await storage.listAssignmentAttempts(req.params.assignmentId);
      const submissions = await Promise.all(
        attempts.map(async (attempt) => {
          const student = await storage.getStudent(attempt.localStudentId);
          const responses = await storage.listAssignmentResponses(attempt.id);
          const totalScore = responses.reduce((s, r) => s + (r.marksAwarded || 0), 0);
          const gradedCount = responses.filter(r => r.marksAwarded !== null).length;
          return {
            attemptId: attempt.id,
            studentId: attempt.localStudentId,
            studentUsername: student?.username || "Unknown",
            status: attempt.status,
            startedAt: attempt.startedAt,
            completedAt: attempt.completedAt,
            timeRemainingSeconds: attempt.timeRemainingSeconds,
            completedParts: attempt.completedPartIds?.length || 0,
            totalScore,
            gradedResponses: gradedCount,
            totalResponses: responses.length,
            responses: responses.map(r => ({
              partId: r.partId,
              textAnswer: r.textAnswer,
              marksAwarded: r.marksAwarded,
              aiFeedback: r.aiFeedback,
            })),
          };
        })
      );
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching assignment submissions:", error);
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  app.post("/api/student/sync-exam-results", requireStudentAuth, async (req, res) => {
    try {
      const studentId = (req as any).studentId;
      const { results } = req.body;
      if (!Array.isArray(results)) return res.status(400).json({ error: "results array required" });

      const existing = await storage.getStudentExamResults(studentId);
      const existingKeys = new Set(existing.map(r => `${r.examType}:${r.examIdentifier}:${r.score}:${r.maxMarks}`));
      let synced = 0;

      for (const result of results) {
        const key = `${result.examType}:${result.examIdentifier}:${result.totalScore || result.score}:${result.maxScore || result.maxMarks}`;
        if (existingKeys.has(key)) continue;

        await storage.saveStudentExamResult({
          studentId,
          examType: result.examType || "past-paper",
          examIdentifier: result.examIdentifier || String(result.year || "unknown"),
          examTitle: result.additionalExamTitle || (result.examType === "past-paper" ? `${result.year} Past Paper` : result.examTitle) || null,
          score: result.totalScore || result.score || 0,
          maxMarks: result.maxScore || result.maxMarks || 0,
          percentage: result.percentage ?? (result.maxScore > 0 ? Math.round(((result.totalScore || result.score || 0) / (result.maxScore || result.maxMarks || 1)) * 100) : 0),
          timeSpentSeconds: result.timeSpentSeconds || null,
          answers: result.breakdown || result.answers || null,
        });
        synced++;
      }

      res.json({ synced });
    } catch (error) {
      console.error("Sync exam results error:", error);
      res.status(500).json({ error: "Failed to sync results" });
    }
  });

  // ==================== TEACHER EXAM RESULT REVIEW API ====================

  app.get("/api/teacher/exam-results/:id", requireAuth, async (req, res) => {
    try {
      const result = await storage.getStudentExamResultById(req.params.id);
      if (!result) return res.status(404).json({ error: "Result not found" });
      res.json(result);
    } catch (error) {
      console.error("Get exam result error:", error);
      res.status(500).json({ error: "Failed to fetch exam result" });
    }
  });

  app.patch("/api/teacher/exam-results/:id", requireAuth, async (req, res) => {
    try {
      const result = await storage.getStudentExamResultById(req.params.id);
      if (!result) return res.status(404).json({ error: "Result not found" });

      const answers = req.body.answers;
      if (!Array.isArray(answers)) return res.status(400).json({ error: "answers must be an array" });

      const updatedBreakdown = answers.map((item: any) => {
        const maxMarks = item.maxMarks ?? 0;
        const marks = Math.min(Math.max(0, Number(item.marks ?? item.score ?? 0)), maxMarks);
        return {
          ...item,
          marks,
          score: marks,
        };
      });

      const totalScore = updatedBreakdown.reduce((s: number, item: any) => s + (item.marks ?? 0), 0);
      const maxMarks = updatedBreakdown.reduce((s: number, item: any) => s + (item.maxMarks ?? 0), 0);
      const percentage = maxMarks > 0 ? Math.round((totalScore / maxMarks) * 100) : 0;

      const updated = await storage.updateStudentExamResult(req.params.id, {
        answers: updatedBreakdown,
        score: totalScore,
        maxMarks,
        percentage,
      });
      res.json(updated);
    } catch (error) {
      console.error("Update exam result error:", error);
      res.status(500).json({ error: "Failed to update exam result" });
    }
  });

  // ==================== TEACHER: DELETE EXAM RESULT / ASSIGNMENT ATTEMPT ====================

  app.delete("/api/teacher/exam-results/:id", requireAuth, async (req, res) => {
    try {
      const result = await storage.getStudentExamResultById(req.params.id);
      if (!result) return res.status(404).json({ error: "Exam result not found" });
      if (result.studentId) {
        const student = await storage.getStudent(result.studentId);
        if (student) {
          const cls = await storage.getClass(student.classId);
          if (!cls || cls.teacherId !== (req as any).userId) {
            return res.status(403).json({ error: "Not authorized to delete this result" });
          }
        }
      }
      await storage.deleteStudentExamResult(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete exam result error:", error);
      res.status(500).json({ error: "Failed to delete exam result" });
    }
  });

  app.delete("/api/teacher/assignment-attempts/:id", requireAuth, async (req, res) => {
    try {
      const attempt = await storage.getAssignmentAttempt(req.params.id);
      if (!attempt) return res.status(404).json({ error: "Assignment attempt not found" });
      if (attempt.localStudentId) {
        const student = await storage.getStudent(attempt.localStudentId);
        if (student) {
          const cls = await storage.getClass(student.classId);
          if (!cls || cls.teacherId !== (req as any).userId) {
            return res.status(403).json({ error: "Not authorized to delete this attempt" });
          }
        }
      }
      await storage.deleteAssignmentAttempt(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete assignment attempt error:", error);
      res.status(500).json({ error: "Failed to delete assignment attempt" });
    }
  });

  // ==================== ORPHANED EXAM RESULTS API ====================

  app.get("/api/teacher/orphaned-exam-results", requireAuth, async (req, res) => {
    try {
      const orphaned = await storage.getOrphanedExamResults();
      res.json(orphaned);
    } catch (error) {
      console.error("Get orphaned results error:", error);
      res.status(500).json({ error: "Failed to fetch orphaned results" });
    }
  });

  app.post("/api/teacher/link-exam-result", requireAuth, async (req, res) => {
    try {
      const { examResultId, studentId } = req.body;
      if (!examResultId || !studentId) return res.status(400).json({ error: "examResultId and studentId required" });
      const result = await storage.getStudentExamResultById(examResultId);
      if (!result) return res.status(404).json({ error: "Exam result not found" });
      const student = await storage.getStudent(studentId);
      if (!student) return res.status(404).json({ error: "Student not found" });
      await storage.linkExamResultToStudent(examResultId, studentId);
      res.json({ success: true });
    } catch (error) {
      console.error("Link exam result error:", error);
      res.status(500).json({ error: "Failed to link exam result" });
    }
  });

  // ==================== EXAM PROGRESS SYNC API ====================

  app.post("/api/student/exam-progress", requireStudentAuth, async (req, res) => {
    try {
      const studentId = (req as any).studentId;
      const { examType, examIdentifier, examTitle, totalQuestions, answeredQuestions, answeredQuestionIds, currentAnswers, timeLeft, currentQuestionIndex, extraTimeAdded } = req.body;
      if (!examType || !examIdentifier) return res.status(400).json({ error: "examType and examIdentifier required" });

      const progress = await storage.upsertExamProgress(studentId, examType, examIdentifier, {
        examTitle: examTitle || null,
        totalQuestions: totalQuestions || 0,
        answeredQuestions: answeredQuestions || 0,
        answeredQuestionIds: answeredQuestionIds || null,
        currentAnswers: currentAnswers || null,
        timeLeft: timeLeft ?? null,
        currentQuestionIndex: currentQuestionIndex ?? null,
        extraTimeAdded: extraTimeAdded || null,
        status: "in_progress",
      });
      res.json({ id: progress.id });
    } catch (error) {
      console.error("Exam progress sync error:", error);
      res.status(500).json({ error: "Failed to sync exam progress" });
    }
  });

  app.get("/api/student/exam-progress", requireStudentAuth, async (req, res) => {
    try {
      const studentId = (req as any).studentId;
      const { examType, examIdentifier } = req.query;
      if (!examType || !examIdentifier) return res.status(400).json({ error: "examType and examIdentifier required" });
      const progress = await storage.getExamProgressForStudent(studentId, String(examType), String(examIdentifier));
      res.json(progress || null);
    } catch (error) {
      console.error("Get exam progress error:", error);
      res.status(500).json({ error: "Failed to get exam progress" });
    }
  });

  app.delete("/api/student/exam-progress", requireStudentAuth, async (req, res) => {
    try {
      const studentId = (req as any).studentId;
      const { examType, examIdentifier } = req.body;
      if (!examType || !examIdentifier) return res.status(400).json({ error: "examType and examIdentifier required" });
      await storage.deleteExamProgress(studentId, examType, examIdentifier);
      res.json({ ok: true });
    } catch (error) {
      console.error("Exam progress delete error:", error);
      res.status(500).json({ error: "Failed to delete exam progress" });
    }
  });

  app.get("/api/students/:id/exam-progress", requireAuth, async (req, res) => {
    try {
      const progress = await storage.getExamProgressByStudent(req.params.id);
      res.json(progress);
    } catch (error) {
      console.error("Student exam progress error:", error);
      res.status(500).json({ error: "Failed to fetch exam progress" });
    }
  });

  // ==================== ASSIGNMENT RESPONSES API ====================

  app.get("/api/assignment-attempts/:attemptId/responses", async (req, res) => {
    try {
      const responses = await storage.listAssignmentResponses(req.params.attemptId);
      const attempt = await storage.getAssignmentAttempt(req.params.attemptId);

      const idLookup: Record<string, { partLabel: string; partTitle: string | null; inputStyle: string | null; sectionTitle: string | null; subQuestionLabel: string | null }> = {};

      if (attempt) {
        const sections = await storage.listAssignmentSections(attempt.assignmentId);
        for (const section of sections) {
          const parts = await storage.listAssignmentParts(section.id);
          for (const part of parts) {
            idLookup[part.id] = {
              partLabel: `Task ${part.partLabel}`,
              partTitle: part.title ?? null,
              inputStyle: part.inputStyle ?? "text",
              sectionTitle: section.title,
              subQuestionLabel: null,
            };
            const subQs = (part.subQuestions as any[]) || [];
            for (let i = 0; i < subQs.length; i++) {
              const sq = subQs[i];
              if (sq && sq.id) {
                const sqLabel = sq.label?.trim() || `Q${i + 1}`;
                idLookup[sq.id] = {
                  partLabel: `Task ${part.partLabel} — ${sqLabel}`,
                  partTitle: sq.text?.trim() || part.title || null,
                  inputStyle: sq.inputStyle || part.inputStyle || "text",
                  sectionTitle: section.title,
                  subQuestionLabel: sqLabel,
                };
              }
            }
          }
        }
      }

      const enriched = responses.map(r => {
        const info = idLookup[r.partId];
        return {
          ...r,
          partLabel: info?.partLabel || r.partId,
          partTitle: info?.partTitle || null,
          inputStyle: info?.inputStyle || "text",
          sectionTitle: info?.sectionTitle || null,
        };
      });
      res.json(enriched);
    } catch (error) {
      console.error("Error listing responses:", error);
      res.status(500).json({ error: "Failed to list responses" });
    }
  });

  app.post("/api/assignment-responses", async (req, res) => {
    try {
      const response = await storage.createAssignmentResponse(req.body);
      res.status(201).json(response);
    } catch (error) {
      console.error("Error creating response:", error);
      res.status(500).json({ error: "Failed to create response" });
    }
  });

  app.put("/api/assignment-responses/:id", async (req, res) => {
    try {
      const response = await storage.updateAssignmentResponse(req.params.id, req.body);
      res.json(response);
    } catch (error) {
      console.error("Error updating response:", error);
      res.status(500).json({ error: "Failed to update response" });
    }
  });

  // ==================== STUDENT AUTH API ====================

  const studentLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: "Too many login attempts, please try again later" },
    validate: false,
  });

  app.post("/api/student/login", studentLoginLimiter, async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }
      const student = await storage.getStudentByUsername(username);
      if (!student) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      const valid = await bcrypt.compare(password, student.password);
      if (!valid) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      await storage.deleteStudentSessionsByStudentId(student.id);
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await storage.createStudentSession(token, student.id, student.username, expiresAt);
      res.json({
        token,
        studentId: student.id,
        username: student.username,
        mustChangePassword: student.mustChangePassword,
        className: (await storage.getClass(student.classId))?.name || "Unknown",
      });
    } catch (error) {
      console.error("Student login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/student/verify", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token) return res.status(401).json({ valid: false });
      const session = await storage.getStudentSession(token);
      if (!session) return res.status(401).json({ valid: false });
      const student = await storage.getStudent(session.studentId);
      if (!student) return res.status(401).json({ valid: false });
      const cls = await storage.getClass(student.classId);
      res.json({
        valid: true,
        studentId: session.studentId,
        username: session.username,
        mustChangePassword: student.mustChangePassword,
        className: cls?.name || "Unknown",
      });
    } catch (error) {
      console.error("Student verify error:", error);
      res.status(401).json({ valid: false });
    }
  });

  app.post("/api/student/change-password", requireStudentAuth, async (req, res) => {
    try {
      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 4) {
        return res.status(400).json({ error: "Password must be at least 4 characters" });
      }
      const hashed = await bcrypt.hash(newPassword, 10);
      await storage.updateStudentPassword((req as any).studentId, hashed, false);
      res.json({ success: true });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  app.post("/api/student/logout", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (token) await storage.deleteStudentSession(token);
      res.json({ success: true });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  });

  // ==================== STUDENT EXAM RESULTS API ====================

  app.post("/api/student/exam-results", requireStudentAuth, async (req, res) => {
    try {
      const result = await storage.saveStudentExamResult({
        studentId: (req as any).studentId,
        examType: req.body.examType,
        examIdentifier: req.body.examIdentifier,
        examTitle: req.body.examTitle || null,
        additionalPaperId: req.body.additionalPaperId || null,
        score: req.body.score,
        maxMarks: req.body.maxMarks,
        percentage: req.body.percentage,
        timeSpentSeconds: req.body.timeSpentSeconds || null,
        answers: req.body.answers || null,
      });
      res.status(201).json(result);
    } catch (error) {
      console.error("Save exam result error:", error);
      res.status(500).json({ error: "Failed to save result" });
    }
  });

  app.get("/api/student/my-results", requireStudentAuth, async (req, res) => {
    try {
      const results = await storage.getStudentExamResults((req as any).studentId);
      res.json(results);
    } catch (error) {
      console.error("Fetch results error:", error);
      res.status(500).json({ error: "Failed to fetch results" });
    }
  });

  app.get("/api/student/my-assignment-attempts", requireStudentAuth, async (req, res) => {
    try {
      const studentId = (req as any).studentId;
      const attempts = await storage.listAssignmentAttemptsByStudent(studentId);
      const assignments = await storage.listAssignments();
      const titleMap: Record<string, string> = {};
      for (const a of assignments) titleMap[a.id] = a.title;

      const enriched = await Promise.all(attempts.map(async (att) => {
        const responses = await storage.listAssignmentResponses(att.id);
        const totalScore = responses.reduce((s, r) => s + (r.marksAwarded ?? 0), 0);
        const gradedCount = responses.filter(r => r.marksAwarded !== null).length;
        return {
          attemptId: att.id,
          assignmentId: att.assignmentId,
          assignmentTitle: titleMap[att.assignmentId] || "Assignment",
          status: att.status,
          startedAt: att.startedAt,
          completedAt: att.completedAt,
          completedParts: (att.completedPartIds || []).length,
          totalResponses: responses.length,
          gradedResponses: gradedCount,
          totalScore,
        };
      }));
      res.json(enriched);
    } catch (error) {
      console.error("Fetch student attempts error:", error);
      res.status(500).json({ error: "Failed to fetch attempts" });
    }
  });

  app.get("/api/student/assignment-attempts/:attemptId/responses", requireStudentAuth, async (req, res) => {
    try {
      const studentId = (req as any).studentId;
      const attempt = await storage.getAssignmentAttempt(req.params.attemptId);
      if (!attempt) {
        return res.status(404).json({ error: "Attempt not found" });
      }
      if (attempt.localStudentId !== studentId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const responses = await storage.listAssignmentResponses(req.params.attemptId);
      const idLookup: Record<string, { partLabel: string; partTitle: string | null; inputStyle: string | null; sectionTitle: string | null; subQuestionLabel: string | null }> = {};

      const sections = await storage.listAssignmentSections(attempt.assignmentId);
      for (const section of sections) {
        const parts = await storage.listAssignmentParts(section.id);
        for (const part of parts) {
          idLookup[part.id] = {
            partLabel: `Task ${part.partLabel}`,
            partTitle: part.title ?? null,
            inputStyle: part.inputStyle ?? "text",
            sectionTitle: section.title,
            subQuestionLabel: null,
          };
          const subQs = (part.subQuestions as any[]) || [];
          for (let i = 0; i < subQs.length; i++) {
            const sq = subQs[i];
            if (sq && sq.id) {
              const sqLabel = sq.label?.trim() || `Q${i + 1}`;
              idLookup[sq.id] = {
                partLabel: `Task ${part.partLabel} — ${sqLabel}`,
                partTitle: sq.text?.trim() || part.title || null,
                inputStyle: sq.inputStyle || part.inputStyle || "text",
                sectionTitle: section.title,
                subQuestionLabel: sqLabel,
              };
            }
          }
        }
      }

      const enriched = responses.map(r => {
        const info = idLookup[r.partId];
        return {
          ...r,
          partLabel: info?.partLabel || r.partId,
          partTitle: info?.partTitle || null,
          inputStyle: info?.inputStyle || "text",
          sectionTitle: info?.sectionTitle || null,
          subQuestionLabel: info?.subQuestionLabel || null,
        };
      });
      res.json(enriched);
    } catch (error) {
      console.error("Fetch student attempt responses error:", error);
      res.status(500).json({ error: "Failed to fetch responses" });
    }
  });

  // ==================== CLASS MANAGEMENT API (Teacher-only) ====================

  app.post("/api/classes", requireAuth, async (req, res) => {
    try {
      const { name } = req.body;
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({ error: "Class name is required" });
      }
      const cls = await storage.createClass({ name: name.trim(), teacherId: "teacher" });
      res.status(201).json(cls);
    } catch (error) {
      console.error("Create class error:", error);
      res.status(500).json({ error: "Failed to create class" });
    }
  });

  app.get("/api/classes", requireAuth, async (req, res) => {
    try {
      const classes = await storage.listClassesByTeacher("teacher");
      const classesWithCounts = await Promise.all(
        classes.map(async (cls) => {
          const students = await storage.listStudentsByClass(cls.id);
          return { ...cls, studentCount: students.length };
        })
      );
      res.json(classesWithCounts);
    } catch (error) {
      console.error("List classes error:", error);
      res.status(500).json({ error: "Failed to list classes" });
    }
  });

  app.delete("/api/classes/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteClass(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete class error:", error);
      res.status(500).json({ error: "Failed to delete class" });
    }
  });

  app.get("/api/classes/:id/students", requireAuth, async (req, res) => {
    try {
      const students = await storage.listStudentsByClass(req.params.id);
      res.json(students.map(s => ({ id: s.id, username: s.username, classId: s.classId, mustChangePassword: s.mustChangePassword, createdAt: s.createdAt })));
    } catch (error) {
      console.error("List students error:", error);
      res.status(500).json({ error: "Failed to list students" });
    }
  });

  const ADJECTIVES = ["happy","brave","clever","swift","calm","bright","kind","bold","cool","keen","quick","smart","neat","fair","glad","wise","warm","sharp","proud","true","lucky","eager","ready","steady","merry","gentle","lively","active","noble","loyal"];
  const ANIMALS = ["fox","owl","bear","wolf","hawk","deer","lynx","hare","wren","dove","pike","seal","lark","swan","crow","robin","otter","finch","mouse","eagle","raven","salmon","badger","heron","falcon","parrot","panda","koala","tiger","whale"];

  function generateFriendlyUsername(): string {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    const num = Math.floor(Math.random() * 900) + 100;
    return `${adj}-${animal}-${num}`;
  }

  app.post("/api/classes/:id/students", requireAuth, async (req, res) => {
    try {
      const { count } = req.body;
      const numToCreate = Math.min(Math.max(parseInt(count) || 1, 1), 50);
      const created: { id: string; username: string; plainPassword: string; classId: string }[] = [];

      for (let i = 0; i < numToCreate; i++) {
        let username: string;
        let attempts = 0;
        do {
          username = generateFriendlyUsername();
          const existing = await storage.getStudentByUsername(username);
          if (!existing) break;
          attempts++;
        } while (attempts < 20);
        if (attempts >= 20) {
          username = generateFriendlyUsername() + "-" + crypto.randomBytes(2).toString("hex");
        }

        const plainPassword = crypto.randomBytes(4).toString("hex");
        const hashed = await bcrypt.hash(plainPassword, 10);
        const student = await storage.createStudent({
          username,
          password: hashed,
          classId: req.params.id,
          mustChangePassword: true,
        });
        created.push({
          id: student.id,
          username: student.username,
          plainPassword,
          classId: student.classId,
        });
      }

      res.status(201).json(numToCreate === 1 ? created[0] : created);
    } catch (error) {
      console.error("Add student error:", error);
      res.status(500).json({ error: "Failed to add student" });
    }
  });

  app.patch("/api/students/:id/username", requireAuth, async (req, res) => {
    try {
      const student = await storage.getStudent(req.params.id);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      const { username } = req.body;
      if (!username || typeof username !== "string" || username.trim().length < 3) {
        return res.status(400).json({ error: "Username must be at least 3 characters" });
      }
      const cleaned = username.trim().toLowerCase().replace(/[^a-z0-9\-_]/g, "");
      if (cleaned.length < 3) {
        return res.status(400).json({ error: "Username must contain at least 3 valid characters (letters, numbers, hyphens, underscores)" });
      }
      const existing = await storage.getStudentByUsername(cleaned);
      if (existing && existing.id !== req.params.id) {
        return res.status(409).json({ error: "Username already taken" });
      }
      await storage.updateStudentUsername(req.params.id, cleaned);
      await storage.deleteStudentSessionsByStudentId(req.params.id);
      res.json({ success: true, username: cleaned });
    } catch (error) {
      console.error("Update username error:", error);
      res.status(500).json({ error: "Failed to update username" });
    }
  });

  app.delete("/api/students/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteStudent(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete student error:", error);
      res.status(500).json({ error: "Failed to delete student" });
    }
  });

  app.post("/api/students/:id/reset-password", requireAuth, async (req, res) => {
    try {
      const plainPassword = crypto.randomBytes(4).toString("hex");
      const hashed = await bcrypt.hash(plainPassword, 10);
      await storage.updateStudentPassword(req.params.id, hashed, true);
      res.json({ plainPassword });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  // ==================== TEACHER PROGRESS VIEWS API ====================

  app.get("/api/classes/:id/progress", requireAuth, async (req, res) => {
    try {
      const students = await storage.listStudentsByClass(req.params.id);
      const progress = await Promise.all(
        students.map(async (s) => {
          const results = await storage.getStudentExamResults(s.id);
          const attempts = await storage.listAssignmentAttemptsByStudent(s.id);
          const latestSession = await storage.getLatestStudentSession(s.id);
          const activeExams = await storage.getExamProgressByStudent(s.id);
          const examCount = results.length;
          const avgScore = examCount > 0
            ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / examCount)
            : 0;
          const assignmentsInProgress = attempts.filter(a => a.status === "in_progress").length;
          const assignmentsCompleted = attempts.filter(a => a.status === "completed").length;
          const lastExamDate = results.length > 0
            ? results.sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0].completedAt
            : null;
          const lastAttemptDate = attempts.length > 0
            ? attempts.sort((a, b) => new Date(b.startedAt!).getTime() - new Date(a.startedAt!).getTime())[0].startedAt
            : null;
          const lastLoginDate = latestSession
            ? new Date(latestSession.expiresAt.getTime() - 24 * 60 * 60 * 1000)
            : null;
          const lastActive = [lastExamDate, lastAttemptDate, lastLoginDate]
            .filter(Boolean)
            .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0] || null;
          return {
            id: s.id,
            username: s.username,
            examCount,
            averageScore: avgScore,
            examsInProgress: activeExams.length,
            assignmentsInProgress,
            assignmentsCompleted,
            lastActive,
          };
        })
      );
      res.json(progress);
    } catch (error) {
      console.error("Class progress error:", error);
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  app.get("/api/students/:id/results", requireAuth, async (req, res) => {
    try {
      const results = await storage.getStudentExamResults(req.params.id);
      res.json(results);
    } catch (error) {
      console.error("Student results error:", error);
      res.status(500).json({ error: "Failed to fetch results" });
    }
  });

  app.get("/api/students/:id/assignment-attempts", requireAuth, async (req, res) => {
    try {
      const attempts = await storage.listAssignmentAttemptsByStudent(req.params.id);
      const allAssignments = await storage.listAssignments();
      const assignmentMap = new Map(allAssignments.map(a => [a.id, a]));

      const allParts = await Promise.all(
        allAssignments.map(a => storage.listAssignmentSections(a.id).then(sections =>
          Promise.all(sections.map(s => storage.listAssignmentParts(s.id)))
        ).then(nested => nested.flat()))
      );
      const partsPerAssignment = new Map<string, typeof allParts[0]>();
      allAssignments.forEach((a, i) => partsPerAssignment.set(a.id, allParts[i]));

      const enriched = await Promise.all(
        attempts.map(async (attempt) => {
          const assignment = assignmentMap.get(attempt.assignmentId);
          const responses = await storage.listAssignmentResponses(attempt.id);
          const totalScore = responses.reduce((s, r) => s + (r.marksAwarded || 0), 0);
          const gradedCount = responses.filter(r => r.marksAwarded !== null).length;
          const parts = partsPerAssignment.get(attempt.assignmentId) || [];
          const maxMarks = parts.reduce((s, p) => s + (p.maxMarks || 0), 0);
          return {
            attemptId: attempt.id,
            assignmentId: attempt.assignmentId,
            assignmentTitle: assignment?.title || "Unknown Assignment",
            status: attempt.status,
            startedAt: attempt.startedAt,
            completedAt: attempt.completedAt,
            timeRemainingSeconds: attempt.timeRemainingSeconds,
            completedParts: attempt.completedPartIds?.length || 0,
            totalScore,
            maxMarks,
            percentage: maxMarks > 0 ? Math.round((totalScore / maxMarks) * 100) : 0,
            gradedResponses: gradedCount,
            totalResponses: responses.length,
          };
        })
      );
      res.json(enriched);
    } catch (error) {
      console.error("Student assignment attempts error:", error);
      res.status(500).json({ error: "Failed to fetch assignment attempts" });
    }
  });

  app.get("/api/results/exam/:identifier", requireAuth, async (req, res) => {
    try {
      const results = await storage.getExamResultsByExamIdentifier(req.params.identifier);
      res.json(results);
    } catch (error) {
      console.error("Exam results error:", error);
      res.status(500).json({ error: "Failed to fetch exam results" });
    }
  });

  const ttsLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: { error: "Too many TTS requests, please try again later." },
  });

  app.post("/api/tts", ttsLimiter, async (req: Request, res: Response) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== "string" || text.trim().length === 0) {
        return res.status(400).json({ error: "Text is required" });
      }

      const trimmed = text.slice(0, 2000);
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "TTS not configured" });
      }

      const ttsUrl = "https://texttospeech.googleapis.com/v1/text:synthesize?key=" + apiKey;
      const payload = {
        input: { text: trimmed },
        voice: { languageCode: "en-GB", name: "en-GB-Neural2-A" },
        audioConfig: { audioEncoding: "MP3", speakingRate: 0.95 },
      };

      let lastError: any;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const resp = await fetch(ttsUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!resp.ok) {
            const errBody = await resp.text();
            throw new Error("TTS API error " + resp.status + ": " + errBody);
          }

          const data = await resp.json() as { audioContent?: string };
          if (!data.audioContent) {
            throw new Error("No audio content in response");
          }

          const audioBuffer = Buffer.from(data.audioContent, "base64");
          res.set("Content-Type", "audio/mpeg");
          res.set("Content-Length", String(audioBuffer.length));
          return res.send(audioBuffer);
        } catch (err) {
          lastError = err;
          if (attempt < 2) await new Promise(r => setTimeout(r, 200));
        }
      }

      console.error("TTS failed after 3 attempts:", lastError);
      res.status(502).json({ error: "Text-to-speech service unavailable" });
    } catch (error) {
      console.error("TTS error:", error);
      res.status(500).json({ error: "TTS processing failed" });
    }
  });

}
