import type { Express } from "express";
import { storage, db } from "./n5-storage";
import { sql, lt } from "drizzle-orm";
import { studentSessions as studentSessionsTable } from "@shared/n5-schema";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import multer from "multer";
import path from "path";
import fs from "fs";
import { sendPasswordResetEmail } from "./email";
import mammoth from "mammoth";

const uploadDir = path.join(process.cwd(), "public", "assets");
const attachedAssetsDir = path.join(process.cwd(), "attached_assets");
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
    const allowedImageTypes = /jpeg|jpg|png|gif|webp|svg/;
    const allowedDocTypes = /pdf|doc|docx|ppt|pptx/;
    const allowedCodeTypes = /py|css|html|htm|js|sql|txt|vb|json|xml|csv/;
    const ext = path.extname(file.originalname).toLowerCase();
    const isImage = allowedImageTypes.test(ext);
    const isDoc = allowedDocTypes.test(ext);
    const isCode = allowedCodeTypes.test(ext);
    if (isImage || isDoc || isCode) {
      cb(null, true);
    } else {
      cb(new Error("Only image, document, and code files are allowed"));
    }
  }
});

// File upload for assignment resources (allows more file types)
const assignmentUpload = multer({
  storage: fileStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB for databases/larger files
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg|accdb|mdb|html|htm|css|js|sql|txt|pdf|zip|py|vb/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed for assignment resources"));
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

const MAX_SESSIONS = 100;
const sessions = new Map<string, { username: string; expiresAt: number }>();

function cleanExpiredSessions() {
  const now = Date.now();
  for (const [token, session] of sessions) {
    if (session.expiresAt < now) {
      sessions.delete(token);
    }
  }
}

function addSession(token: string, data: { username: string; expiresAt: number }) {
  cleanExpiredSessions();
  if (sessions.size >= MAX_SESSIONS) {
    let oldestToken = "";
    let oldestTime = Infinity;
    for (const [t, s] of sessions) {
      if (s.expiresAt < oldestTime) {
        oldestTime = s.expiresAt;
        oldestToken = t;
      }
    }
    if (oldestToken) sessions.delete(oldestToken);
  }
  sessions.set(token, data);
}

setInterval(cleanExpiredSessions, 60 * 60 * 1000);

const gradingCache = new Map<string, { marks: number; feedback: string; suggestions: string; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

const CODE_FILE_EXTENSIONS = new Set([".py", ".css", ".html", ".htm", ".js", ".sql", ".txt", ".vb", ".json", ".xml", ".csv"]);

function readExampleFileContents(exampleFiles: Array<{ url: string; originalName: string }>): string {
  if (!exampleFiles || exampleFiles.length === 0) return "";
  let content = "\n\n--- TEACHER'S EXAMPLE FILES ---\n";
  content += "The teacher has provided the following example files showing what a correct answer should contain. Compare the student's work against these:\n\n";
  for (const file of exampleFiles) {
    try {
      const relativePath = file.url.replace(/^\/assets\//, "");
      let filePath = path.join(process.cwd(), "public", "assets", relativePath);
      if (!fs.existsSync(filePath)) {
        filePath = path.join(process.cwd(), "attached_assets", relativePath);
      }
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        content += `=== File: ${file.originalName} ===\n`;
        content += fileContent;
        content += `\n=== End of ${file.originalName} ===\n\n`;
      }
    } catch (err) {
      console.error(`Error reading example file ${file.originalName}:`, err);
    }
  }
  return content;
}

function hashGradingRequest(studentAnswer: string, markingScheme: string[], maxMarks: number, aiGuidance?: string, exampleImages?: string[], exampleFiles?: Array<{ url: string; originalName: string }>, hasDiagramImage?: boolean): string {
  const imagesKey = exampleImages && exampleImages.length > 0 ? `|imgs:${exampleImages.join(',')}` : '';
  const filesKey = exampleFiles && exampleFiles.length > 0 ? `|files:${exampleFiles.map(f => f.url).join(',')}` : '';
  const diagramKey = hasDiagramImage ? '|diagram:visual' : '';
  const normalized = `${studentAnswer.toLowerCase().trim()}|${JSON.stringify(markingScheme)}|${maxMarks}|${aiGuidance || ''}${imagesKey}${filesKey}${diagramKey}`;
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
}

function pcmToWav(pcmData: Buffer, sampleRate: number, channels: number, bitsPerSample: number): Buffer {
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcmData.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcmData.length, 40);
  return Buffer.concat([header, pcmData]);
}

export async function registerN5Routes(
  app: Express
): Promise<void> {
  // Serve static files from public/assets directory, with fallback to attached_assets
  const expressStatic = (await import("express")).default.static;
  app.use("/assets", expressStatic(uploadDir));
  app.use("/assets", expressStatic(attachedAssetsDir));

  // Text-to-Speech endpoint using Google Cloud TTS
  app.post("/api/tts", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== "string" || text.length > 2000) {
        return res.status(400).json({ error: "Text is required and must be under 2000 characters" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({ error: "TTS service unavailable" });
      }

      const maxRetries = 3;
      let lastError = "";
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const ttsResponse = await fetch(
            `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                input: { text },
                voice: { languageCode: "en-GB", name: "en-GB-Neural2-A" },
                audioConfig: { audioEncoding: "MP3", speakingRate: 0.95 },
              }),
            }
          );

          if (ttsResponse.ok) {
            const data = await ttsResponse.json() as { audioContent?: string };
            if (!data.audioContent) continue;

            const mp3Buffer = Buffer.from(data.audioContent, "base64");
            res.set({
              "Content-Type": "audio/mpeg",
              "Content-Length": mp3Buffer.length.toString(),
              "Cache-Control": "no-cache",
            });
            return res.send(mp3Buffer);
          }

          lastError = `HTTP ${ttsResponse.status}`;
          if (attempt < maxRetries - 1) {
            await new Promise(r => setTimeout(r, 200));
          }
        } catch (e: any) {
          lastError = e?.message || "fetch failed";
        }
      }

      console.error("[TTS] All retries failed:", lastError);
      return res.status(502).json({ error: "TTS generation failed" });
    } catch (err: any) {
      console.error("[TTS] Error:", err?.message || err);
      res.status(500).json({ error: "TTS generation failed" });
    }
  });

  // File upload endpoint
  app.post("/api/upload", upload.single("file"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const url = `/assets/${req.file.filename}`;
    res.json({ url, filename: req.file.filename, originalName: req.file.originalname });
  });

  // Word document upload and parse endpoint for AI guidance
  app.post("/api/upload-word-document", upload.single("file"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    if (ext !== ".docx" && ext !== ".doc") {
      // Clean up the uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "Only Word documents (.docx, .doc) are allowed" });
    }

    try {
      // Parse the Word document using mammoth
      const result = await mammoth.extractRawText({ path: req.file.path });
      const extractedText = result.value;

      // Clean up the uploaded file after extraction
      fs.unlinkSync(req.file.path);

      res.json({ 
        text: extractedText, 
        filename: req.file.originalname,
        messages: result.messages 
      });
    } catch (error) {
      // Clean up the uploaded file on error
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      console.error("Error parsing Word document:", error);
      res.status(500).json({ message: "Failed to parse Word document" });
    }
  });

  // Teacher login endpoint
  app.post("/api/teacher/login", async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: "Username/email and password required" });
    }

    try {
      // Try to find user by username first, then by email
      let user = await storage.getUserByUsername(username);
      
      if (!user && username.includes("@")) {
        // If not found and looks like an email, try email lookup
        user = await storage.getUserByEmail(username);
      }
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.password);
      
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Create session token
      const sessionToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
      
      addSession(sessionToken, {
        username: user.username,
        expiresAt
      });

      res.json({ 
        success: true, 
        token: sessionToken,
        expiresAt 
      });
    } catch (error: any) {
      console.error("Login error:", error?.message || error);
      // Provide more specific error message
      if (error?.message?.includes('connect') || error?.message?.includes('timeout')) {
        return res.status(503).json({ message: "Database connection issue. Please try again." });
      }
      res.status(500).json({ message: "Server error. Please try again." });
    }
  });

  // Verify session endpoint
  app.get("/api/teacher/verify", (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const session = sessions.get(token);
    
    if (!session || session.expiresAt < Date.now()) {
      sessions.delete(token);
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    res.json({ valid: true, username: session.username });
  });

  // Non-conflicting login/verify aliases for the native teacher dashboard.
  // The /api/teacher/login path is shadowed by Higher revision routes (registered first),
  // so N5 needs its own paths to write into its own in-memory sessions Map.
  app.post("/api/n5/teacher/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username/email and password required" });
    }
    try {
      let user = await storage.getUserByUsername(username);
      if (!user && username.includes("@")) {
        user = await storage.getUserByEmail(username);
      }
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const sessionToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
      addSession(sessionToken, { username: user.username, expiresAt });
      res.json({ success: true, token: sessionToken, expiresAt });
    } catch (error: any) {
      console.error("N5 login error:", error?.message || error);
      if (error?.message?.includes('connect') || error?.message?.includes('timeout')) {
        return res.status(503).json({ message: "Database connection issue. Please try again." });
      }
      res.status(500).json({ message: "Server error. Please try again." });
    }
  });

  app.get("/api/n5/teacher/verify", (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    const session = sessions.get(token);
    if (!session || session.expiresAt < Date.now()) {
      sessions.delete(token);
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    res.json({ valid: true, username: session.username });
  });

  // Password reset endpoint
  // Request password reset - sends email with reset link
  app.post("/api/teacher/reset-password", async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email address required" });
    }

    try {
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Don't reveal if email exists for security
        return res.json({ success: true, message: "If an account exists with this email, a reset link has been sent." });
      }

      // Generate secure token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      
      await storage.createPasswordResetToken(user.id, resetToken, expiresAt);
      
      // Build reset link
      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : process.env.REPLIT_DOMAINS 
          ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
          : 'http://localhost:5000';
      const resetLink = `${baseUrl}/teacher/reset-password/${resetToken}`;
      
      const emailSent = await sendPasswordResetEmail(email, resetLink);
      
      if (!emailSent) {
        return res.status(500).json({ message: "Failed to send email. Please try again." });
      }

      res.json({ success: true, message: "If an account exists with this email, a reset link has been sent." });
    } catch (error: any) {
      console.error("Password reset error:", error?.message || error);
      res.status(500).json({ message: "Server error. Please try again." });
    }
  });

  // Verify password reset token
  app.get("/api/teacher/reset-password/:token", async (req, res) => {
    const { token } = req.params;
    
    try {
      const tokenData = await storage.getPasswordResetToken(token);
      
      if (!tokenData) {
        return res.status(404).json({ valid: false, message: "Invalid or expired reset link" });
      }

      if (tokenData.usedAt) {
        return res.status(400).json({ valid: false, message: "This reset link has already been used" });
      }

      if (new Date() > tokenData.expiresAt) {
        return res.status(400).json({ valid: false, message: "This reset link has expired" });
      }

      res.json({ valid: true });
    } catch (error: any) {
      console.error("Token verification error:", error?.message || error);
      res.status(500).json({ valid: false, message: "Server error" });
    }
  });

  // Complete password reset with new password
  app.post("/api/teacher/reset-password/:token", async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    try {
      const tokenData = await storage.getPasswordResetToken(token);
      
      if (!tokenData) {
        return res.status(404).json({ message: "Invalid or expired reset link" });
      }

      if (tokenData.usedAt) {
        return res.status(400).json({ message: "This reset link has already been used" });
      }

      if (new Date() > tokenData.expiresAt) {
        return res.status(400).json({ message: "This reset link has expired" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUserPassword(tokenData.userId, hashedPassword);
      await storage.markPasswordResetTokenUsed(token);

      res.json({ success: true, message: "Password has been reset successfully" });
    } catch (error: any) {
      console.error("Password reset completion error:", error?.message || error);
      res.status(500).json({ message: "Server error. Please try again." });
    }
  });

  // Update teacher email endpoint
  app.post("/api/teacher/update-email", async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const { email } = req.body;
    
    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const session = sessions.get(token);
    if (!session || session.expiresAt < Date.now()) {
      return res.status(401).json({ message: "Session expired" });
    }

    try {
      const user = await storage.getUserByUsername(session.username);
      if (!user) {
        return res.status(404).json({ message: "Account not found" });
      }

      await storage.updateUserEmail(user.id, email);
      res.json({ success: true, message: "Email updated successfully" });
    } catch (error: any) {
      console.error("Update email error:", error?.message || error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get teacher profile endpoint
  app.get("/api/teacher/profile", async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const session = sessions.get(token);
    if (!session || session.expiresAt < Date.now()) {
      return res.status(401).json({ message: "Session expired" });
    }

    try {
      const user = await storage.getUserByUsername(session.username);
      if (!user) {
        return res.status(404).json({ message: "Account not found" });
      }

      res.json({ email: user.email || "" });
    } catch (error: any) {
      console.error("Get profile error:", error?.message || error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get teacher email (alias for profile)
  app.get("/api/teacher/email", async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const session = sessions.get(token);
    if (!session || session.expiresAt < Date.now()) {
      return res.status(401).json({ message: "Session expired" });
    }

    try {
      const user = await storage.getUserByUsername(session.username);
      if (!user) {
        return res.status(404).json({ message: "Account not found" });
      }

      res.json({ email: user.email || "" });
    } catch (error: any) {
      console.error("Get email error:", error?.message || error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Update teacher email (POST)
  app.post("/api/teacher/email", async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const { email } = req.body;
    
    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const session = sessions.get(token);
    if (!session || session.expiresAt < Date.now()) {
      return res.status(401).json({ message: "Session expired" });
    }

    try {
      const user = await storage.getUserByUsername(session.username);
      if (!user) {
        return res.status(404).json({ message: "Account not found" });
      }

      await storage.updateUserEmail(user.id, email);
      res.json({ success: true, message: "Email updated successfully" });
    } catch (error: any) {
      console.error("Update email error:", error?.message || error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Change password endpoint
  app.post("/api/teacher/change-password", async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    const { oldPassword, newPassword } = req.body;
    
    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const session = sessions.get(token);
    
    if (!session || session.expiresAt < Date.now()) {
      return res.status(401).json({ message: "Session expired" });
    }

    try {
      const user = await storage.getUserByUsername(session.username);
      
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

  // Logout endpoint
  app.post("/api/teacher/logout", (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    
    if (token) {
      sessions.delete(token);
    }

    res.json({ success: true });
  });

  // ==================== STUDENT AUTH ====================
  async function cleanExpiredStudentSessions() {
    if (!db) return;
    try {
      await db.delete(studentSessionsTable).where(lt(studentSessionsTable.expiresAt, new Date()));
    } catch (e) {
      console.error("Failed to clean expired student sessions:", e);
    }
  }
  setInterval(cleanExpiredStudentSessions, 60 * 60 * 1000);
  cleanExpiredStudentSessions();

  async function getStudentFromToken(req: any): Promise<{ studentId: string; username: string } | null> {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token || !db) return null;
    try {
      const [session] = await db.select().from(studentSessionsTable).where(sql`${studentSessionsTable.token} = ${token}`);
      if (!session || new Date(session.expiresAt) < new Date()) {
        if (session) {
          await db.delete(studentSessionsTable).where(sql`${studentSessionsTable.token} = ${token}`);
        }
        return null;
      }
      return { studentId: session.studentId, username: session.username };
    } catch (e) {
      console.error("Error checking student session:", e);
      return null;
    }
  }

  const ADJECTIVES = ["brave","clever","swift","bright","calm","eager","fair","gentle","happy","keen","lively","noble","proud","quick","sharp","steady","true","vivid","warm","wise"];
  const ANIMALS = ["badger","cobra","dolphin","eagle","falcon","gecko","hawk","iguana","jaguar","koala","lemur","meerkat","newt","otter","panda","quail","robin","snake","tiger","viper"];

  function generateUsername(): string {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    const num = Math.floor(Math.random() * 90) + 10;
    return `${adj}-${animal}-${num}`;
  }

  function generatePassword(): string {
    const chars = "abcdefghjkmnpqrstuvwxyz23456789";
    let pw = "";
    for (let i = 0; i < 6; i++) pw += chars[Math.floor(Math.random() * chars.length)];
    return pw;
  }

  app.post("/api/student/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) return res.status(400).json({ error: "Username and password required" });

      const student = await storage.getStudentByUsername(username.toLowerCase().trim());
      if (!student) return res.status(401).json({ error: "Invalid username or password" });

      const valid = await bcrypt.compare(password, student.password);
      if (!valid) return res.status(401).json({ error: "Invalid username or password" });

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
      await cleanExpiredStudentSessions();
      if (db) {
        await db.insert(studentSessionsTable).values({
          token,
          studentId: student.id,
          username: student.username,
          expiresAt: new Date(expiresAt),
        });
      }

      res.json({
        token,
        expiresAt,
        mustChangePassword: student.mustChangePassword,
        username: student.username,
        studentId: student.id,
      });
    } catch (error) {
      console.error("Student login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.get("/api/student/verify", async (req, res) => {
    const student = await getStudentFromToken(req);
    if (!student) return res.status(401).json({ error: "Not authenticated" });
    try {
      const studentRecord = await storage.getStudent(student.studentId);
      res.json({ valid: true, username: student.username, studentId: student.studentId, mustChangePassword: studentRecord?.mustChangePassword || false });
    } catch {
      res.json({ valid: true, username: student.username, studentId: student.studentId, mustChangePassword: false });
    }
  });

  app.post("/api/student/change-password", async (req, res) => {
    try {
      const student = await getStudentFromToken(req);
      if (!student) return res.status(401).json({ error: "Not authenticated" });

      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 4) return res.status(400).json({ error: "Password must be at least 4 characters" });

      const hashed = await bcrypt.hash(newPassword, 10);
      await storage.updateStudentPassword(student.studentId, hashed, false, null);
      res.json({ success: true });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  app.post("/api/student/logout", async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (token && db) {
      await db.delete(studentSessionsTable).where(sql`${studentSessionsTable.token} = ${token}`);
    }
    res.json({ success: true });
  });

  app.post("/api/student/exam-progress", async (req, res) => {
    try {
      const student = await getStudentFromToken(req);
      if (!student) return res.status(401).json({ error: "Not authenticated" });

      const { year, optionalSection, timeLeft, currentQuestion, answeredCount, totalQuestions, answeredQuestionIds, userInputs, examType, examIdentifier, extraTimeAdded } = req.body;
      if (timeLeft === undefined) {
        return res.status(400).json({ error: "timeLeft is required" });
      }

      const progress = await storage.upsertActiveExamProgress({
        studentId: student.studentId,
        year: typeof year === "number" ? year : 0,
        optionalSection: optionalSection || null,
        timeLeft,
        currentQuestion: currentQuestion ?? 0,
        answeredCount: answeredCount ?? 0,
        totalQuestions: totalQuestions ?? 0,
        answeredQuestionIds: answeredQuestionIds || null,
        userInputs: userInputs || null,
        examType: examType || "past-paper",
        examIdentifier: examIdentifier || null,
        extraTimeAdded: extraTimeAdded || null,
      });

      res.json(progress);
    } catch (error) {
      console.error("Save exam progress error:", error);
      res.status(500).json({ error: "Failed to save exam progress" });
    }
  });

  app.get("/api/student/exam-progress", async (req, res) => {
    try {
      const student = await getStudentFromToken(req);
      if (!student) return res.status(401).json({ error: "Not authenticated" });

      const progress = await storage.getActiveExamProgressByStudent(student.studentId);
      if (!progress) return res.json(null);
      res.json(progress);
    } catch (error) {
      console.error("Get exam progress error:", error);
      res.status(500).json({ error: "Failed to get exam progress" });
    }
  });

  app.delete("/api/student/exam-progress", async (req, res) => {
    try {
      const student = await getStudentFromToken(req);
      if (!student) return res.status(401).json({ error: "Not authenticated" });

      await storage.deleteActiveExamProgress(student.studentId);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete exam progress error:", error);
      res.status(500).json({ error: "Failed to delete exam progress" });
    }
  });

  // ==================== TEACHER CLASS MANAGEMENT ====================
  app.post("/api/teacher/classes", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token || !sessions.has(token)) return res.status(401).json({ error: "Unauthorized" });

      const { name } = req.body;
      if (!name || !name.trim()) return res.status(400).json({ error: "Class name required" });

      const cls = await storage.createClass({ name: name.trim() });
      res.json(cls);
    } catch (error) {
      console.error("Create class error:", error);
      res.status(500).json({ error: "Failed to create class" });
    }
  });

  app.get("/api/teacher/classes", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token || !sessions.has(token)) return res.status(401).json({ error: "Unauthorized" });

      const allClasses = await storage.getClasses();
      res.json(allClasses);
    } catch (error) {
      console.error("Get classes error:", error);
      res.status(500).json({ error: "Failed to get classes" });
    }
  });

  app.delete("/api/teacher/classes/:id", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token || !sessions.has(token)) return res.status(401).json({ error: "Unauthorized" });

      await storage.deleteClass(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete class error:", error);
      res.status(500).json({ error: "Failed to delete class" });
    }
  });

  app.post("/api/teacher/classes/:id/students", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token || !sessions.has(token)) return res.status(401).json({ error: "Unauthorized" });

      const cls = await storage.getClass(req.params.id);
      if (!cls) return res.status(404).json({ error: "Class not found" });

      let username = generateUsername();
      let existing = await storage.getStudentByUsername(username);
      let attempts = 0;
      while (existing && attempts < 10) {
        username = generateUsername();
        existing = await storage.getStudentByUsername(username);
        attempts++;
      }

      const plainPassword = generatePassword();
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      const student = await storage.createStudent({
        username,
        password: hashedPassword,
        initialPassword: plainPassword,
        classId: req.params.id,
        mustChangePassword: true,
      });

      res.json({
        id: student.id,
        username: student.username,
        plainPassword,
        classId: student.classId,
      });
    } catch (error) {
      console.error("Add student error:", error);
      res.status(500).json({ error: "Failed to add student" });
    }
  });

  app.post("/api/teacher/classes/:id/students/bulk", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token || !sessions.has(token)) return res.status(401).json({ error: "Unauthorized" });

      const cls = await storage.getClass(req.params.id);
      if (!cls) return res.status(404).json({ error: "Class not found" });

      const count = parseInt(req.body.count);
      if (!count || count < 1 || count > 50) return res.status(400).json({ error: "Count must be between 1 and 50" });

      const results: { id: string; username: string; plainPassword: string }[] = [];

      for (let i = 0; i < count; i++) {
        let username = generateUsername();
        let existing = await storage.getStudentByUsername(username);
        let attempts = 0;
        while (existing && attempts < 10) {
          username = generateUsername();
          existing = await storage.getStudentByUsername(username);
          attempts++;
        }

        const plainPassword = generatePassword();
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        const student = await storage.createStudent({
          username,
          password: hashedPassword,
          initialPassword: plainPassword,
          classId: req.params.id,
          mustChangePassword: true,
        });

        results.push({
          id: student.id,
          username: student.username,
          plainPassword,
        });
      }

      res.json({ students: results });
    } catch (error) {
      console.error("Bulk add students error:", error);
      res.status(500).json({ error: "Failed to add students" });
    }
  });

  app.get("/api/teacher/classes/:id/students", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token || !sessions.has(token)) return res.status(401).json({ error: "Unauthorized" });

      const students = await storage.getStudentsByClass(req.params.id);
      res.json(students.map(s => ({ id: s.id, username: s.username, classId: s.classId, mustChangePassword: s.mustChangePassword, createdAt: s.createdAt })));
    } catch (error) {
      console.error("Get students error:", error);
      res.status(500).json({ error: "Failed to get students" });
    }
  });

  app.get("/api/teacher/classes/:id/active-progress", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token || !sessions.has(token)) return res.status(401).json({ error: "Unauthorized" });

      const classStudents = await storage.getStudentsByClass(req.params.id);
      const studentMap = new Map(classStudents.map(s => [s.id, s.username]));

      const examProgress = await storage.getActiveExamProgressByClass(req.params.id);
      const fifteenMinAgo = Date.now() - 15 * 60 * 1000;

      const result: any[] = [];

      for (const ep of examProgress) {
        const updatedTime = ep.updatedAt ? new Date(ep.updatedAt).getTime() : 0;
        if (updatedTime < fifteenMinAgo) continue;

        let label = ep.year === 0 ? "Additional Paper" : `${ep.year} Paper`;
        if (ep.optionalSection) {
          label += ` (${ep.optionalSection === "dd" ? "Database" : "Web"})`;
        }

        result.push({
          studentId: ep.studentId,
          username: studentMap.get(ep.studentId) || "Unknown",
          type: "exam",
          label,
          timeLeft: ep.timeLeft || 0,
          currentQuestion: ep.currentQuestion || 0,
          answeredCount: ep.answeredCount || 0,
          totalQuestions: ep.totalQuestions || 0,
          answeredQuestionIds: ep.answeredQuestionIds || [],
          updatedAt: ep.updatedAt,
        });
      }

      const allAssignments = await storage.getAllAssignments();
      const assignmentMap = new Map(allAssignments.map(a => [a.id, a.title]));

      for (const student of classStudents) {
        try {
          const attempts = await storage.getAssignmentAttemptsByStudentAccount(student.id);
          const activeAttempts = attempts.filter(a => a.status === "in_progress" || a.status === "paused");
          for (const attempt of activeAttempts) {
            const lastActivity = attempt.pausedAt || attempt.completedAt || null;
            if (lastActivity && new Date(lastActivity).getTime() < fifteenMinAgo) continue;

            result.push({
              studentId: student.id,
              username: student.username,
              type: "assignment",
              label: assignmentMap.get(attempt.assignmentId) || "Assignment",
              timeLeft: attempt.timeRemainingSeconds || 0,
              currentQuestion: 0,
              answeredCount: (attempt.completedPartIds || []).length,
              totalQuestions: 0,
              updatedAt: lastActivity || new Date().toISOString(),
            });
          }
        } catch (e) {}
      }

      res.json(result);
    } catch (error) {
      console.error("Get active progress error:", error);
      res.status(500).json({ error: "Failed to get active progress" });
    }
  });

  app.delete("/api/teacher/students/:id", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token || !sessions.has(token)) return res.status(401).json({ error: "Unauthorized" });

      await storage.deleteStudent(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete student error:", error);
      res.status(500).json({ error: "Failed to delete student" });
    }
  });

  app.post("/api/teacher/students/:id/reset-password", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token || !sessions.has(token)) return res.status(401).json({ error: "Unauthorized" });

      const student = await storage.getStudent(req.params.id);
      if (!student) return res.status(404).json({ error: "Student not found" });

      const plainPassword = generatePassword();
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      await storage.updateStudentPassword(req.params.id, hashedPassword, true, plainPassword);

      res.json({ plainPassword, username: student.username });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  app.get("/api/teacher/classes/:id/credentials", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token || !sessions.has(token)) return res.status(401).json({ error: "Unauthorized" });

      const cls = await storage.getClass(req.params.id);
      if (!cls) return res.status(404).json({ error: "Class not found" });

      const students = await storage.getStudentsByClass(req.params.id);
      const rows = students.map(s => ({
        username: s.username,
        initialPassword: s.initialPassword || null,
        hasChangedPassword: !s.mustChangePassword,
      }));

      res.json({ className: cls.name, students: rows });
    } catch (error) {
      console.error("Get credentials error:", error);
      res.status(500).json({ error: "Failed to get credentials" });
    }
  });

  // ==================== ADDITIONAL PAPERS ====================
  app.post("/api/teacher/additional-papers", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token || !sessions.has(token)) return res.status(401).json({ error: "Unauthorized" });

      const { name } = req.body;
      if (!name || !name.trim()) return res.status(400).json({ error: "Paper name required" });

      const paper = await storage.createAdditionalPaper({ name: name.trim() });
      res.json(paper);
    } catch (error) {
      console.error("Create additional paper error:", error);
      res.status(500).json({ error: "Failed to create paper" });
    }
  });

  app.get("/api/teacher/additional-papers", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token || !sessions.has(token)) return res.status(401).json({ error: "Unauthorized" });

      const papers = await storage.getAdditionalPapers();
      const allQuestions = await storage.getAllQuestions();

      const papersWithCounts = papers.map(p => ({
        ...p,
        questionCount: allQuestions.filter(q => q.additionalPaperId === p.id).length,
        totalMarks: allQuestions
          .filter(q => q.additionalPaperId === p.id)
          .reduce((sum, q) => {
            let marks = 0;
            for (const sq of q.subQuestions) {
              if (sq.subParts && sq.subParts.length > 0) {
                for (const sp of sq.subParts) marks += sp.maxMarks || 0;
              } else {
                marks += sq.maxMarks || 0;
              }
            }
            return sum + marks;
          }, 0),
      }));

      res.json(papersWithCounts);
    } catch (error) {
      console.error("Get additional papers error:", error);
      res.status(500).json({ error: "Failed to get papers" });
    }
  });

  app.put("/api/teacher/additional-papers/:id", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token || !sessions.has(token)) return res.status(401).json({ error: "Unauthorized" });

      const paper = await storage.getAdditionalPaper(req.params.id);
      if (!paper) return res.status(404).json({ error: "Paper not found" });

      const updates: any = {};
      if (req.body.name !== undefined) updates.name = req.body.name.trim();
      if (req.body.isPublished !== undefined) updates.isPublished = req.body.isPublished;

      const updated = await storage.updateAdditionalPaper(req.params.id, updates);
      res.json(updated);
    } catch (error) {
      console.error("Update additional paper error:", error);
      res.status(500).json({ error: "Failed to update paper" });
    }
  });

  app.delete("/api/teacher/additional-papers/:id", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token || !sessions.has(token)) return res.status(401).json({ error: "Unauthorized" });

      await storage.deleteAdditionalPaper(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete additional paper error:", error);
      res.status(500).json({ error: "Failed to delete paper" });
    }
  });

  app.get("/api/additional-papers/published", async (_req, res) => {
    try {
      const papers = await storage.getPublishedAdditionalPapers();
      res.json(papers);
    } catch (error) {
      console.error("Get published papers error:", error);
      res.status(500).json({ error: "Failed to get published papers" });
    }
  });

  // ==================== TEACHER ANALYTICS ====================
  app.get("/api/teacher/classes/:id/overview", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token || !sessions.has(token)) return res.status(401).json({ error: "Unauthorized" });

      const classStudents = await storage.getStudentsByClass(req.params.id);
      const overview = [];

      for (const student of classStudents) {
        const examResultsList = await storage.getExamResultsByStudent(student.id);
        const assignmentAttemptsList = await storage.getAssignmentAttemptsByStudentAccount(student.id);

        overview.push({
          id: student.id,
          username: student.username,
          examResults: examResultsList.map(r => ({
            id: r.id,
            year: r.year,
            optionalSection: r.optionalSection,
            score: r.score,
            maxScore: r.maxScore,
            grade: r.grade,
            timestamp: r.timestamp,
          })),
          assignmentAttempts: assignmentAttemptsList.map(a => ({
            id: a.id,
            assignmentId: a.assignmentId,
            status: a.status,
            completedAt: a.completedAt,
          })),
        });
      }

      res.json(overview);
    } catch (error) {
      console.error("Class overview error:", error);
      res.status(500).json({ error: "Failed to get class overview" });
    }
  });

  app.get("/api/teacher/students/:id/detail", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token || !sessions.has(token)) return res.status(401).json({ error: "Unauthorized" });

      const student = await storage.getStudent(req.params.id);
      if (!student) return res.status(404).json({ error: "Student not found" });

      const examResultsList = await storage.getExamResultsByStudent(student.id);
      const assignmentAttemptsList = await storage.getAssignmentAttemptsByStudentAccount(student.id);

      const assignmentDetails = [];
      for (const attempt of assignmentAttemptsList) {
        const responses = await storage.getAssignmentResponses(attempt.id);
        const assignment = await storage.getAssignment(attempt.assignmentId);
        assignmentDetails.push({
          attempt: {
            id: attempt.id,
            assignmentId: attempt.assignmentId,
            assignmentTitle: assignment?.title || "Unknown",
            status: attempt.status,
            completedAt: attempt.completedAt,
          },
          responses: responses.map(r => ({
            id: r.id,
            partId: r.partId,
            subQuestionId: r.subQuestionId,
            textAnswer: r.textAnswer,
            codeAnswer: r.codeAnswer,
            marksAwarded: r.marksAwarded,
            aiFeedback: r.aiFeedback,
          })),
        });
      }

      res.json({
        student: { id: student.id, username: student.username },
        examResults: examResultsList,
        assignments: assignmentDetails,
      });
    } catch (error) {
      console.error("Student detail error:", error);
      res.status(500).json({ error: "Failed to get student detail" });
    }
  });

  app.get("/api/teacher/analytics/exam/:year", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token || !sessions.has(token)) return res.status(401).json({ error: "Unauthorized" });

      const year = parseInt(req.params.year);
      const results = await storage.getExamResultsByYear(year);

      const questionStats: Record<string, { totalScore: number; maxScore: number; attempts: number }> = {};

      for (const result of results) {
        const breakdown = result.breakdown as any[];
        if (!breakdown) continue;
        for (const item of breakdown) {
          const key = item.questionId || item.questionLabel || `Q${breakdown.indexOf(item) + 1}`;
          if (!questionStats[key]) questionStats[key] = { totalScore: 0, maxScore: 0, attempts: 0 };
          questionStats[key].totalScore += item.score || 0;
          questionStats[key].maxScore = item.maxMarks || questionStats[key].maxScore;
          questionStats[key].attempts += 1;
        }
      }

      const analytics = Object.entries(questionStats).map(([questionId, stats]) => ({
        questionId,
        averageScore: stats.attempts > 0 ? Math.round((stats.totalScore / stats.attempts) * 10) / 10 : 0,
        maxScore: stats.maxScore,
        totalAttempts: stats.attempts,
        difficulty: stats.attempts > 0 ? Math.round((1 - stats.totalScore / (stats.maxScore * stats.attempts)) * 100) : 0,
      }));

      res.json({ year, totalResults: results.length, questions: analytics });
    } catch (error) {
      console.error("Exam analytics error:", error);
      res.status(500).json({ error: "Failed to get exam analytics" });
    }
  });

  app.get("/api/teacher/analytics/assignment/:id", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token || !sessions.has(token)) return res.status(401).json({ error: "Unauthorized" });

      const assignment = await storage.getAssignment(req.params.id);
      if (!assignment) return res.status(404).json({ error: "Assignment not found" });

      const sections = await storage.getAssignmentSections(assignment.id);
      const allParts: any[] = [];
      for (const section of sections) {
        const parts = await storage.getAssignmentParts(section.id);
        allParts.push(...parts);
      }

      const questionStats: Record<string, { label: string; totalScore: number; maxScore: number; attempts: number }> = {};

      for (const part of allParts) {
        const subQuestions = (part.subQuestions as any[]) || [];
        if (subQuestions.length > 0) {
          const flattenLeaves = (qs: any[]): any[] => {
            const leaves: any[] = [];
            for (const q of qs) {
              if (q.subParts?.length > 0) leaves.push(...flattenLeaves(q.subParts));
              else leaves.push(q);
            }
            return leaves;
          };
          for (const subQ of flattenLeaves(subQuestions)) {
            questionStats[subQ.id] = {
              label: subQ.label || subQ.questionLabel || "",
              totalScore: 0,
              maxScore: subQ.maxMarks || 0,
              attempts: 0,
            };
          }
        } else {
          questionStats[part.id] = { label: part.partLabel || "", totalScore: 0, maxScore: part.maxMarks || 0, attempts: 0 };
        }
      }

      if (db) {
        const responsesResult = await db.execute(sql`
          SELECT ar.part_id, ar.sub_question_id, ar.marks_awarded 
          FROM assignment_responses ar 
          JOIN assignment_attempts aa ON ar.attempt_id = aa.id 
          WHERE aa.assignment_id = ${assignment.id} AND ar.marks_awarded IS NOT NULL
        `);

        for (const row of responsesResult.rows) {
          const r = row as any;
          const key = r.sub_question_id || r.part_id;
          if (questionStats[key]) {
            questionStats[key].totalScore += r.marks_awarded || 0;
            questionStats[key].attempts += 1;
          }
        }
      }

      const analytics = Object.entries(questionStats).map(([id, stats]) => ({
        questionId: id,
        label: stats.label,
        averageScore: stats.attempts > 0 ? Math.round((stats.totalScore / stats.attempts) * 10) / 10 : 0,
        maxScore: stats.maxScore,
        totalAttempts: stats.attempts,
        difficulty: stats.attempts > 0 && stats.maxScore > 0
          ? Math.round((1 - stats.totalScore / (stats.maxScore * stats.attempts)) * 100) : 0,
      }));

      res.json({ assignmentId: assignment.id, title: assignment.title, questions: analytics });
    } catch (error) {
      console.error("Assignment analytics error:", error);
      res.status(500).json({ error: "Failed to get assignment analytics" });
    }
  });

  // ==================== EXAM RESULTS ====================
  app.get("/api/teacher/exam-results/:id", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token || !sessions.has(token)) return res.status(401).json({ error: "Unauthorized" });

      const result = await storage.getExamResult(req.params.id);
      if (!result) return res.status(404).json({ error: "Exam result not found" });

      res.json(result);
    } catch (error) {
      console.error("Get exam result error:", error);
      res.status(500).json({ error: "Failed to get exam result" });
    }
  });

  app.patch("/api/teacher/exam-results/:id", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token || !sessions.has(token)) return res.status(401).json({ error: "Unauthorized" });

      const existing = await storage.getExamResult(req.params.id);
      if (!existing) return res.status(404).json({ error: "Exam result not found" });

      const { breakdown } = req.body;
      if (!breakdown || !Array.isArray(breakdown)) {
        return res.status(400).json({ error: "breakdown array is required" });
      }

      const existingBreakdown = existing.breakdown as any[];
      if (!existingBreakdown || breakdown.length !== existingBreakdown.length) {
        return res.status(400).json({ error: "breakdown length must match existing result" });
      }

      const mergedBreakdown = existingBreakdown.map((orig: any, i: number) => {
        const submitted = breakdown[i];
        const score = typeof submitted?.score === "number" && isFinite(submitted.score)
          ? Math.max(0, Math.min(Math.round(submitted.score), orig.maxMarks || 0))
          : orig.score;
        const feedback = typeof submitted?.feedback === "string" ? submitted.feedback : orig.feedback;
        return { ...orig, score, feedback };
      });

      const newScore = mergedBreakdown.reduce((sum: number, q: any) => sum + (q.score || 0), 0);
      const newMaxScore = mergedBreakdown.reduce((sum: number, q: any) => sum + (q.maxMarks || 0), 0);

      const pct = newMaxScore > 0 ? (newScore / newMaxScore) * 100 : 0;
      let newGrade = "No Award";
      if (pct >= 85) newGrade = "A";
      else if (pct >= 70) newGrade = "B";
      else if (pct >= 60) newGrade = "C";
      else if (pct >= 50) newGrade = "D";

      const updated = await storage.updateExamResult(req.params.id, {
        score: newScore,
        maxScore: newMaxScore,
        grade: newGrade,
        breakdown: mergedBreakdown,
      });

      res.json(updated);
    } catch (error) {
      console.error("Update exam result error:", error);
      res.status(500).json({ error: "Failed to update exam result" });
    }
  });

  app.get("/api/teacher/orphaned-exam-results", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token || !sessions.has(token)) return res.status(401).json({ error: "Unauthorized" });

      const results = await storage.getOrphanedExamResults();
      res.json(results);
    } catch (error) {
      console.error("Get orphaned exam results error:", error);
      res.status(500).json({ error: "Failed to get orphaned exam results" });
    }
  });

  app.post("/api/teacher/link-exam-result", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token || !sessions.has(token)) return res.status(401).json({ error: "Unauthorized" });

      const { examResultId, studentId } = req.body;
      if (!examResultId || !studentId) {
        return res.status(400).json({ error: "Missing examResultId or studentId" });
      }

      const student = await storage.getStudent(studentId);
      if (!student) return res.status(404).json({ error: "Student not found" });

      const examResult = await storage.getExamResult(examResultId);
      if (!examResult) return res.status(404).json({ error: "Exam result not found" });

      const updated = await storage.linkExamResultToStudent(examResultId, studentId);
      res.json(updated);
    } catch (error) {
      console.error("Link exam result error:", error);
      res.status(500).json({ error: "Failed to link exam result" });
    }
  });

  app.delete("/api/teacher/exam-results/:id", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token || !sessions.has(token)) return res.status(401).json({ error: "Unauthorized" });

      const examResult = await storage.getExamResult(req.params.id);
      if (!examResult) return res.status(404).json({ error: "Exam result not found" });

      await storage.deleteExamResult(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete exam result error:", error);
      res.status(500).json({ error: "Failed to delete exam result" });
    }
  });

  app.delete("/api/teacher/assignment-attempts/:id", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token || !sessions.has(token)) return res.status(401).json({ error: "Unauthorized" });

      const attempt = await storage.getAssignmentAttempt(req.params.id);
      if (!attempt) return res.status(404).json({ error: "Assignment attempt not found" });

      await storage.deleteAssignmentAttempt(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete assignment attempt error:", error);
      res.status(500).json({ error: "Failed to delete assignment attempt" });
    }
  });

  app.post("/api/exam-results", async (req, res) => {
    try {
      const student = await getStudentFromToken(req);
      const { year, optionalSection, score, maxScore, grade, breakdown, additionalPaperId } = req.body;

      if (year === undefined || score === undefined || maxScore === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (additionalPaperId && !student?.studentId) {
        return res.status(401).json({ error: "You must be logged in to save mock exam results" });
      }

      const result = await storage.saveExamResult({
        studentId: student?.studentId || null,
        year,
        optionalSection: optionalSection || null,
        score,
        maxScore,
        grade: grade || null,
        breakdown: breakdown || null,
        additionalPaperId: additionalPaperId || null,
      });

      res.json(result);
    } catch (error) {
      console.error("Save exam result error:", error);
      res.status(500).json({ error: "Failed to save exam result" });
    }
  });

  app.get("/api/student/exam-results", async (req, res) => {
    try {
      const student = await getStudentFromToken(req);
      if (!student) return res.status(401).json({ error: "Not authenticated" });

      const results = await storage.getExamResultsByStudent(student.studentId);
      res.json(results);
    } catch (error) {
      console.error("Get exam results error:", error);
      res.status(500).json({ error: "Failed to get exam results" });
    }
  });

  app.get("/api/student/assignment-attempts", async (req, res) => {
    try {
      const student = await getStudentFromToken(req);
      if (!student) return res.status(401).json({ error: "Not authenticated" });

      const attempts = await storage.getAssignmentAttemptsByStudentAccount(student.studentId);
      const allAssignments = await storage.getAllAssignments();
      const assignmentMap = new Map(allAssignments.map(a => [a.id, a.title]));

      const result = attempts.map(a => ({
        id: a.id,
        assignmentId: a.assignmentId,
        assignmentTitle: assignmentMap.get(a.assignmentId) || "Assignment",
        status: a.status,
        completedAt: a.completedAt,
        startedAt: a.startedAt,
        completedPartIds: a.completedPartIds || [],
      }));

      res.json(result);
    } catch (error) {
      console.error("Get student assignment attempts error:", error);
      res.status(500).json({ error: "Failed to get assignment attempts" });
    }
  });

  app.get("/api/student/assignment-attempts/:attemptId/responses", async (req, res) => {
    try {
      const student = await getStudentFromToken(req);
      if (!student) return res.status(401).json({ error: "Not authenticated" });

      const attempts = await storage.getAssignmentAttemptsByStudentAccount(student.studentId);
      const attempt = attempts.find(a => a.id === req.params.attemptId);
      if (!attempt) return res.status(403).json({ error: "Access denied" });

      const responses = await storage.getAssignmentResponses(req.params.attemptId);
      res.json(responses.map(r => ({
        id: r.id,
        partId: r.partId,
        subQuestionId: r.subQuestionId,
        textAnswer: r.textAnswer,
        codeAnswer: r.codeAnswer,
        marksAwarded: r.marksAwarded,
        aiFeedback: r.aiFeedback,
        submittedAt: r.submittedAt,
      })));
    } catch (error) {
      console.error("Get assignment responses error:", error);
      res.status(500).json({ error: "Failed to get responses" });
    }
  });

  // AI-powered answer grading endpoint with caching for cost efficiency
  app.post("/api/grade-answer", async (req, res) => {
    try {
      const { studentAnswer, markingScheme, maxMarks, questionContext, aiGuidance, markingGuidanceData, diagramImage } = req.body;

      if (!studentAnswer || !markingScheme || maxMarks === undefined) {
        return res.status(400).json({ 
          error: "Missing required fields: studentAnswer, markingScheme, maxMarks" 
        });
      }

      // Build structured guidance from marking criteria table if available
      let combinedGuidance = aiGuidance || "";
      if (markingGuidanceData && markingGuidanceData.rows && markingGuidanceData.rows.length > 0) {
        combinedGuidance += `\n\n--- DETAILED MARKING CRITERIA ---\n`;
        markingGuidanceData.rows.forEach((row: any, index: number) => {
          combinedGuidance += `\nCriterion ${index + 1} (${row.marks} mark${row.marks !== 1 ? 's' : ''}):\n`;
          combinedGuidance += `  Expected Response: ${row.expectedResponse}\n`;
          if (row.additionalGuidance) {
            combinedGuidance += `  Additional Guidance: ${row.additionalGuidance}\n`;
          }
        });
        if (markingGuidanceData.exampleAnswer) {
          combinedGuidance += `\n--- EXAMPLE FULL-MARKS ANSWER ---\n${markingGuidanceData.exampleAnswer}`;
        }
      }

      // Check cache first to avoid duplicate API calls
      const cacheKey = hashGradingRequest(studentAnswer, markingScheme, maxMarks, combinedGuidance || aiGuidance, markingGuidanceData?.exampleImages, markingGuidanceData?.exampleFiles, !!diagramImage);
      const cached = gradingCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        return res.json({
          marks: cached.marks,
          feedback: cached.feedback,
          suggestions: cached.suggestions
        });
      }

      // Condensed system prompt for cost efficiency
      const systemPrompt = `You are an N5 Computing Science exam marker. Grade fairly using the marking scheme.

RULES:
- Use "you" in feedback (not "the student")
- Award marks for equivalent concepts (different wording OK)
- Accept any valid programming syntax or pseudocode
- Be lenient with spelling/grammar
- For diagrams: focus on logic, not exact wording
- If TEACHER GUIDANCE is provided, use it as the source of correct answers
- For labeled fields (e.g., "fieldName: answer"), answers must match the correct field
- IMPORTANT: If the student earns FULL MARKS, set suggestions to empty string "" - they don't need to improve anything

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

FEEDBACK FORMATTING:
- Keep feedback concise — one bullet point per mark available (e.g., a 2-mark question should have exactly 2 bullets)
- Use "• " (bullet character) at the start of each point
- Put each bullet on its own line (separate with newline character)
- Each bullet MUST correspond to a specific mark point from the marking scheme
- State whether that mark was awarded or not, with a brief reason — ONE sentence per bullet, no lengthy explanations
- Example for a 3-mark question:
"• [1/1] You correctly identified the primary key as studentID.\n• [1/1] You correctly identified the foreign key.\n• [0/1] You did not identify the correct data type — it should be real, not integer."
- Do NOT add extra commentary beyond the mark-by-mark breakdown
- Do NOT repeat the question or marking scheme back to the student
- Be direct — state what was correct or incorrect without lengthy explanation
- IMPORTANT: Only award WHOLE marks (integers). Never give half marks or decimal marks (e.g. 1.5, 2.5). Round down if unsure.

TECHNICAL FEEDBACK - USE SUBJECT-APPROPRIATE LANGUAGE:
- Read the question context to determine the topic area and use appropriate technical terminology
- For WEB DEVELOPMENT questions, use terms like: CSS selectors, specificity, inheritance, external/internal/inline stylesheets, relative/absolute file paths, HTML elements, attributes, properties, values, pixels, RGB/hex colour codes, responsive design, accessibility, semantic HTML, class selectors, ID selectors, cascading
- For DATABASE questions, use terms like: SQL queries, SELECT/FROM/WHERE/ORDER BY clauses, primary key, foreign key, entity-relationship diagrams, one-to-many relationships, data types (text, integer, real, boolean), validation, normalization
- For SOFTWARE DESIGN questions, use terms like: pseudocode, flowcharts, structure diagrams, conditional loops (WHILE/UNTIL), fixed loops (FOR), iteration, selection (IF/ELSE), input validation, concatenation, data types, variables, arrays, functions/procedures
- For COMPUTER SYSTEMS questions, use terms like: binary, ASCII/extended ASCII, floating-point representation (mantissa/exponent), bit depth, colour depth, resolution, compression (lossy/lossless), file size calculation, translators (compiler/interpreter)
- Provide educational feedback that helps students understand WHY their answer was correct/incorrect using proper technical vocabulary
- Reference specific concepts from the N5 Computing Science curriculum when explaining errors

ERD (ENTITY RELATIONSHIP DIAGRAM) GRADING:
- Crow's foot lines represent one-to-many relationships
- The FORKED END (crow's foot) represents the "MANY" side
- The PLAIN END (no fork) represents the "ONE" side  
- To determine direction: look at coordinates x1,y1 (start/ONE side) and x2,y2 (end/MANY side)
- If connectedTo1 links to Entity A and connectedTo2 links to Entity B, the relationship is: A (one) to B (many)
- Check the relationshipLabel property for the relationship name
- Example: A crow's foot line from "Customer" to "Order" with fork at Order means: one Customer has many Orders
- Award marks for correct direction - the forked end MUST point to the correct "many" entity

NAVIGATION STRUCTURE DIAGRAM GRADING:
- Navigation structures show how web pages link to each other
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

WEBPAGE WIREFRAME GRADING:
- Webpage wireframe answers show the elements the student placed on a page mockup
- Both the student's answer and the teacher's expected answer are serialized as lists of elements with positions
- Element format: [TYPE at (x, y) size WxH: "content"] where TYPE is HEADING, PARAGRAPH, IMAGE, LINK, AUDIO PLAYER, VIDEO PLAYER, BULLET LIST, NUMBERED LIST, TEXT, CONTAINER/DIV, etc.
- COMPARE ELEMENT TYPES: For each element in the teacher's example, check if the student has an element of the SAME TYPE
  - HEADING in the example requires a HEADING in the student answer (not just TEXT)
  - IMAGE requires an IMAGE element
  - VIDEO PLAYER requires a VIDEO PLAYER, AUDIO PLAYER requires an AUDIO PLAYER
  - PARAGRAPH requires a PARAGRAPH element
  - LINK requires a LINK element
  - BULLET LIST and NUMBERED LIST require the matching list type
- COMPARE APPROXIMATE POSITIONS: Elements should be in roughly the same vertical order
  - Elements at similar y-coordinates are on the same horizontal level
  - Smaller y = higher on page; check top-to-bottom ordering matches the example
  - Be lenient with exact coordinates but verify relative layout (e.g., heading above content, navigation at top)
- CHECK CONTENT: Element labels/text should be appropriate for the context (exact wording not required)
- COUNT ELEMENTS: Verify the student included all required elements (compare total count)
- AWARD MARKS for each correctly placed element type that matches the example layout

GENERAL DIAGRAM GRADING (flowcharts, structure diagrams, etc.):
- Student diagram answers are provided BOTH as text descriptions AND as a visual screenshot when available
- When a screenshot is attached, USE THE VISUAL to understand the diagram — it shows exactly what the student drew
- The text description is a structured backup: SHAPES list + CONNECTIONS list
- Shape format: [TYPE at approx (x, y), size: WxH: "content"] where TYPE is BOX, ELLIPSE, DIAMOND, PARALLELOGRAM, etc.
- Connection format: [LINE from "shape A" to "shape B", arrow-end] or [DATAFLOW-UP from "function", label: "data"]
- Items marked [base] are teacher-provided starting shapes that the student cannot delete
- CHECK SHAPE TYPES: Verify students used the correct shape type for the diagram convention:
  - Flowcharts: BOX=process, DIAMOND=decision, PARALLELOGRAM=input/output, ELLIPSE=start/end
  - Structure diagrams: BOX=process/function
- CHECK LAYOUT: If a visual is attached, look at the actual spatial arrangement. Otherwise use (x, y) coordinates:
  - Shapes at similar y-values are on the same horizontal level
  - A shape with smaller y is ABOVE a shape with larger y
  - Verify hierarchical relationships (parent shapes should be above children)
  - Verify left-to-right ordering where relevant
- CHECK CONNECTIONS: Verify lines/arrows connect the correct shapes in the right direction
- For DATAFLOW arrows: verify data flows in the correct direction (UP=data IN to function, DOWN=data OUT from function) with correct labels
- Compare against the marking scheme's expected objects, positions, and connections
- Be lenient with exact positioning but check relative layout (e.g., "is process A above process B?")
- WHEN VISUAL IS AVAILABLE: Trust what you see in the image over the text description if they seem to conflict

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

Return JSON: {"marks": number, "feedback": "string", "suggestions": "string (empty if full marks)"}`;

      const exampleFilesContent = readExampleFileContents(markingGuidanceData?.exampleFiles || []);

      const userPrompt = `Question: ${questionContext || "N/A"}

Marking Scheme (${maxMarks} marks):
${Array.isArray(markingScheme) ? markingScheme.join('\n') : markingScheme}
${aiGuidance ? `\nTEACHER GUIDANCE (correct answers):\n${aiGuidance}` : ''}
${exampleFilesContent}
Student Answer:
${studentAnswer}`;

      let responseText: string | undefined;

      const markingGuidanceImages: string[] = markingGuidanceData?.exampleImages || [];
      const hasGuidanceImages = markingGuidanceImages.length > 0;

      // Try Gemini first (primary), fall back to Groq if it fails
      if (gemini) {
        try {
          if (hasGuidanceImages || diagramImage) {
            let promptSuffix = "";
            if (hasGuidanceImages && diagramImage) {
              promptSuffix = "\n\nIMPORTANT: The teacher has provided example screenshot(s) showing what a correct answer should look like. A screenshot of the student's diagram is also attached as the LAST image. Use the teacher's reference images to understand the expected answer, and the student's diagram screenshot to see exactly what they drew. Grade by comparing the visual diagrams.";
            } else if (hasGuidanceImages) {
              promptSuffix = "\n\nIMPORTANT: The teacher has provided example screenshot(s) showing what a correct answer should look like. Use these reference images to help grade the student's answer.";
            } else {
              promptSuffix = "\n\nIMPORTANT: A screenshot of the student's diagram is attached. Use this visual alongside the text description to grade the diagram. The visual shows exactly what the student drew — use it to verify layout, connections, labels, and overall structure.";
            }
            const contentParts: any[] = [{ text: `${systemPrompt}\n\n${userPrompt}${promptSuffix}` }];
            if (hasGuidanceImages) {
              for (const imgUrl of markingGuidanceImages) {
                try {
                  const relativePath = imgUrl.replace(/^\/assets\//, "");
                  let filePath = path.join(process.cwd(), "public", "assets", relativePath);
                  if (!fs.existsSync(filePath)) {
                    filePath = path.join(process.cwd(), "attached_assets", relativePath);
                  }
                  if (fs.existsSync(filePath)) {
                    const fileBuffer = fs.readFileSync(filePath);
                    const base64Data = fileBuffer.toString("base64");
                    const ext = path.extname(imgUrl).toLowerCase();
                    let mimeType = "image/jpeg";
                    if (ext === ".png") mimeType = "image/png";
                    else if (ext === ".gif") mimeType = "image/gif";
                    else if (ext === ".webp") mimeType = "image/webp";
                    contentParts.push({
                      inlineData: { data: base64Data, mimeType }
                    });
                  }
                } catch (fileError) {
                  console.error("Error reading marking guidance image:", fileError);
                }
              }
            }
            if (diagramImage) {
              const imgData = diagramImage.replace(/^data:image\/\w+;base64,/, "");
              contentParts.push({ inlineData: { data: imgData, mimeType: "image/png" } });
            }
            const geminiResponse = await gemini.models.generateContent({
              model: "gemini-2.5-flash",
              contents: [{ role: "user", parts: contentParts }],
              config: {
                responseMimeType: "application/json",
                thinkingConfig: { thinkingBudget: 0 }
              }
            });
            responseText = geminiResponse.text;
          } else {
            const geminiResponse = await gemini.models.generateContent({
              model: "gemini-2.5-flash",
              contents: `${systemPrompt}\n\n${userPrompt}`,
              config: {
                responseMimeType: "application/json",
                thinkingConfig: { thinkingBudget: 0 }
              }
            });
            responseText = geminiResponse.text;
          }
        } catch (geminiError: any) {
          // Gemini failed, will fall back to Groq
        }
      }

      // Fallback to Groq if Gemini failed or not available
      if (!responseText) {
        const groqResponse = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          response_format: { type: "json_object" }
        });
        responseText = groqResponse.choices[0]?.message?.content || undefined;
      }

      if (!responseText) {
        throw new Error("No response from AI");
      }
      
      const result = JSON.parse(responseText);

      // Validate the response
      if (typeof result.marks !== 'number' || result.marks < 0 || result.marks > maxMarks) {
        throw new Error("Invalid marks in AI response");
      }

      // Clear suggestions if student got full marks - no need for improvement tips
      const gotFullMarks = result.marks >= maxMarks;
      
      const normalizeFeedback = (val: any): string => {
        if (!val) return "";
        if (typeof val === "string") return val;
        if (Array.isArray(val)) return val.map(String).join("\n");
        return String(val);
      };

      const gradingResult = {
        marks: result.marks,
        feedback: normalizeFeedback(result.feedback),
        suggestions: gotFullMarks ? "" : normalizeFeedback(result.suggestions)
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

  function stripBase64Images(question: any): any {
    const q = JSON.parse(JSON.stringify(question));
    const processBlocks = (blocks: any[], qId: string, prefix: string) => {
      if (!blocks) return;
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        if (block.type === "image" && block.content && block.content.startsWith("data:")) {
          block.content = `/api/question-image/${qId}/${prefix}.${i}`;
        }
        if (block.children) {
          processBlocks(block.children, qId, `${prefix}.${i}.children`);
        }
      }
    };
    const stripField = (obj: any, field: string, qId: string, path: string) => {
      if (obj[field] && typeof obj[field] === "string" && obj[field].startsWith("data:")) {
        obj[field] = `/api/question-image/${qId}/${path}`;
      }
    };
    if (q.scenario) {
      stripField(q.scenario, "imageUrl", q.id, "si");
      if (q.scenario.contentBlocks) {
        processBlocks(q.scenario.contentBlocks, q.id, "s");
      }
    }
    if (q.subQuestions) {
      for (let si = 0; si < q.subQuestions.length; si++) {
        const sub = q.subQuestions[si];
        stripField(sub, "imageUrl", q.id, `qi.${si}`);
        stripField(sub, "drawingBackgroundUrl", q.id, `qd.${si}`);
        if (sub.inputConfig) {
          stripField(sub.inputConfig, "wireframeExampleCanvas", q.id, `qw.${si}`);
          stripField(sub.inputConfig, "navExampleCanvas", q.id, `qn.${si}`);
        }
        if (sub.contentBlocks) {
          processBlocks(sub.contentBlocks, q.id, `q.${si}`);
        }
        if (sub.subParts) {
          for (let pi = 0; pi < sub.subParts.length; pi++) {
            const part = sub.subParts[pi];
            stripField(part, "imageUrl", q.id, `pi.${si}.${pi}`);
            stripField(part, "drawingBackgroundUrl", q.id, `pd.${si}.${pi}`);
            if (part.inputConfig) {
              stripField(part.inputConfig, "wireframeExampleCanvas", q.id, `pw.${si}.${pi}`);
              stripField(part.inputConfig, "navExampleCanvas", q.id, `pn.${si}.${pi}`);
            }
            if (part.contentBlocks) {
              processBlocks(part.contentBlocks, q.id, `q.${si}.p.${pi}`);
            }
          }
        }
      }
    }
    return q;
  }

  app.get("/api/question-image/:questionId/*splat", async (req, res) => {
    try {
      const question = await storage.getQuestion(req.params.questionId);
      if (!question) return res.status(404).send("Not found");
      
      const path = req.params[0];
      const parts = path.split(".");
      let imageData: string | undefined;
      
      const resolveBlock = (blocks: any[], pathParts: string[]): any => {
        if (!blocks || pathParts.length === 0) return null;
        const idx = parseInt(pathParts[0]);
        const block = blocks[idx];
        if (!block) return null;
        if (pathParts.length >= 2 && pathParts[1] === "children" && block.children) {
          return resolveBlock(block.children, pathParts.slice(2));
        }
        return pathParts.length === 1 ? block : null;
      };
      
      if (parts[0] === "s") {
        const blocks = (question as any).scenario?.contentBlocks;
        const block = resolveBlock(blocks || [], parts.slice(1));
        if (block?.type === "image" && block.content?.startsWith("data:")) {
          imageData = block.content;
        }
      } else if (parts[0] === "si") {
        imageData = (question as any).scenario?.imageUrl;
      } else if (parts[0] === "qi") {
        const si = parseInt(parts[1]);
        imageData = (question as any).subQuestions?.[si]?.imageUrl;
      } else if (parts[0] === "qd") {
        const si = parseInt(parts[1]);
        imageData = (question as any).subQuestions?.[si]?.drawingBackgroundUrl;
      } else if (parts[0] === "pi") {
        const si = parseInt(parts[1]);
        const pi = parseInt(parts[2]);
        imageData = (question as any).subQuestions?.[si]?.subParts?.[pi]?.imageUrl;
      } else if (parts[0] === "pd") {
        const si = parseInt(parts[1]);
        const pi = parseInt(parts[2]);
        imageData = (question as any).subQuestions?.[si]?.subParts?.[pi]?.drawingBackgroundUrl;
      } else if (parts[0] === "qw") {
        const si = parseInt(parts[1]);
        imageData = (question as any).subQuestions?.[si]?.inputConfig?.wireframeExampleCanvas;
      } else if (parts[0] === "qn") {
        const si = parseInt(parts[1]);
        imageData = (question as any).subQuestions?.[si]?.inputConfig?.navExampleCanvas;
      } else if (parts[0] === "pw") {
        const si = parseInt(parts[1]);
        const pi = parseInt(parts[2]);
        imageData = (question as any).subQuestions?.[si]?.subParts?.[pi]?.inputConfig?.wireframeExampleCanvas;
      } else if (parts[0] === "pn") {
        const si = parseInt(parts[1]);
        const pi = parseInt(parts[2]);
        imageData = (question as any).subQuestions?.[si]?.subParts?.[pi]?.inputConfig?.navExampleCanvas;
      } else if (parts[0] === "q") {
        const si = parseInt(parts[1]);
        const sub = (question as any).subQuestions?.[si];
        if (!sub) return res.status(404).send("Not found");
        if (parts[2] === "p") {
          const pi = parseInt(parts[3]);
          const blocks = sub.subParts?.[pi]?.contentBlocks;
          const block = resolveBlock(blocks || [], parts.slice(4));
          if (block?.type === "image" && block.content?.startsWith("data:")) {
            imageData = block.content;
          }
        } else {
          const block = resolveBlock(sub.contentBlocks || [], parts.slice(2));
          if (block?.type === "image" && block.content?.startsWith("data:")) {
            imageData = block.content;
          }
        }
      }
      
      if (!imageData || !imageData.startsWith("data:")) {
        return res.status(404).send("Not found");
      }
      
      const match = imageData.match(/^data:(image\/[^;]+);base64,(.+)$/);
      if (!match) return res.status(404).send("Invalid image data");
      
      const contentType = match[1];
      const imageBuffer = Buffer.from(match[2], "base64");
      
      res.set("Content-Type", contentType);
      res.set("Cache-Control", "public, max-age=86400");
      res.send(imageBuffer);
    } catch (error) {
      console.error("Error serving question image:", error);
      res.status(500).send("Error");
    }
  });

  // Questions API endpoints
  // Get regular questions (excludes quiz-only questions)
  app.get("/api/questions", async (req, res) => {
    try {
      const regularQuestions = await storage.getRegularQuestions();

      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
      const isTeacher = token ? sessions.has(token) : false;

      if (isTeacher) {
        return res.json(regularQuestions.map(stripBase64Images));
      }

      const publishedPapers = await storage.getPublishedAdditionalPapers();
      const publishedPaperIds = new Set(publishedPapers.map(p => p.id));

      const forExamPaperId = typeof req.query.forExamPaper === "string" ? req.query.forExamPaper : null;

      const student = await getStudentFromToken(req);

      let completedPaperIds = new Set<string>();
      if (student) {
        const studentResults = await storage.getExamResultsByStudent(student.studentId);
        completedPaperIds = new Set(
          studentResults
            .filter(r => r.additionalPaperId)
            .map(r => r.additionalPaperId!)
        );
      }

      const filtered = regularQuestions.filter(q => {
        if (q.additionalPaperId) {
          if (!publishedPaperIds.has(q.additionalPaperId)) return false;
          if (forExamPaperId === "all" || (forExamPaperId && q.additionalPaperId === forExamPaperId)) return true;
          if (!student) return false;
          return completedPaperIds.has(q.additionalPaperId);
        }
        return true;
      });

      res.json(filtered.map(stripBase64Images));
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  });

  // Get quiz-only questions (for Quiz Manager)
  app.get("/api/questions/quiz-only", async (req, res) => {
    try {
      const quizOnlyQuestions = await storage.getQuizOnlyQuestions();
      res.json(quizOnlyQuestions.map(stripBase64Images));
    } catch (error) {
      console.error("Error fetching quiz-only questions:", error);
      res.status(500).json({ error: "Failed to fetch quiz-only questions" });
    }
  });

  // Get all questions including quiz-only (for quiz creation)
  app.get("/api/questions/all", async (req, res) => {
    try {
      const allQuestions = await storage.getAllQuestions();
      res.json(allQuestions.map(stripBase64Images));
    } catch (error) {
      console.error("Error fetching all questions:", error);
      res.status(500).json({ error: "Failed to fetch all questions" });
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

  app.post("/api/questions", async (req, res) => {
    try {
      const question = await storage.createQuestion(req.body);
      res.status(201).json(question);
    } catch (error) {
      console.error("Error creating question:", error);
      res.status(500).json({ error: "Failed to create question" });
    }
  });

  app.put("/api/questions/:id", async (req, res) => {
    try {
      const question = await storage.updateQuestion({ ...req.body, id: req.params.id });
      res.json(question);
    } catch (error) {
      console.error("Error updating question:", error);
      res.status(500).json({ error: "Failed to update question" });
    }
  });

  app.delete("/api/questions/:id", async (req, res) => {
    try {
      await storage.deleteQuestion(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting question:", error);
      res.status(500).json({ error: "Failed to delete question" });
    }
  });

  // Seed questions endpoint (accepts array of questions to seed)
  app.post("/api/questions/seed", async (req, res) => {
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

  // Migration endpoint: Convert all questions to use content blocks format
  app.post("/api/questions/migrate-to-content-blocks", async (req, res) => {
    try {
      const allQuestions = await storage.getAllQuestions();
      let migratedCount = 0;

      for (const question of allQuestions) {
        let needsUpdate = false;
        const updatedQuestion = { ...question };

        // Migrate subQuestions
        if (updatedQuestion.subQuestions && Array.isArray(updatedQuestion.subQuestions)) {
          updatedQuestion.subQuestions = updatedQuestion.subQuestions.map((subQ: any, subQIdx: number) => {
            const migratedSubQ = migrateSubQuestion(subQ, subQIdx);
            if (migratedSubQ !== subQ) needsUpdate = true;
            return migratedSubQ;
          });
        }

        if (needsUpdate) {
          await storage.updateQuestion(updatedQuestion);
          migratedCount++;
        }
      }

      res.json({ 
        success: true, 
        total: allQuestions.length, 
        migrated: migratedCount 
      });
    } catch (error) {
      console.error("Error migrating questions:", error);
      res.status(500).json({ error: "Failed to migrate questions" });
    }
  });

  // Custom Quiz routes for teachers to create practice quizzes
  
  // Get all custom quizzes (teacher only)
  app.get("/api/custom-quizzes", async (req, res) => {
    try {
      const quizzes = await storage.getAllCustomQuizzes();
      res.json(quizzes);
    } catch (error) {
      console.error("Error fetching custom quizzes:", error);
      res.status(500).json({ error: "Failed to fetch custom quizzes" });
    }
  });

  // Get active quizzes only (for students)
  app.get("/api/custom-quizzes/active", async (req, res) => {
    try {
      const quizzes = await storage.getActiveCustomQuizzes();
      res.json(quizzes);
    } catch (error) {
      console.error("Error fetching active quizzes:", error);
      res.status(500).json({ error: "Failed to fetch active quizzes" });
    }
  });

  // Get single quiz by ID
  app.get("/api/custom-quizzes/:id", async (req, res) => {
    try {
      const quiz = await storage.getCustomQuiz(req.params.id);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      res.json(quiz);
    } catch (error) {
      console.error("Error fetching quiz:", error);
      res.status(500).json({ error: "Failed to fetch quiz" });
    }
  });

  // Create new custom quiz (teacher only)
  app.post("/api/custom-quizzes", async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token || !sessions.has(token)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const { name, description, timeLimitMinutes, questionIds, isActive } = req.body;
      
      if (!name || !questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
        return res.status(400).json({ error: "Name and at least one question are required" });
      }

      const quiz = await storage.createCustomQuiz({
        name,
        description: description || null,
        timeLimitMinutes: timeLimitMinutes || 60,
        questionIds,
        isActive: isActive !== false,
      });

      res.status(201).json(quiz);
    } catch (error) {
      console.error("Error creating custom quiz:", error);
      res.status(500).json({ error: "Failed to create custom quiz" });
    }
  });

  // Update custom quiz (teacher only)
  app.put("/api/custom-quizzes/:id", async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token || !sessions.has(token)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const quiz = await storage.updateCustomQuiz(req.params.id, req.body);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      res.json(quiz);
    } catch (error) {
      console.error("Error updating custom quiz:", error);
      res.status(500).json({ error: "Failed to update custom quiz" });
    }
  });

  // Delete custom quiz (teacher only)
  app.delete("/api/custom-quizzes/:id", async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token || !sessions.has(token)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      await storage.deleteCustomQuiz(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting custom quiz:", error);
      res.status(500).json({ error: "Failed to delete custom quiz" });
    }
  });

  // Get questions for a specific quiz (resolves question IDs to full question data)
  app.get("/api/custom-quizzes/:id/questions", async (req, res) => {
    try {
      const quiz = await storage.getCustomQuiz(req.params.id);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }

      const allQuestions = await storage.getAllQuestions();
      const quizQuestions = allQuestions.filter(q => quiz.questionIds.includes(q.id));
      
      res.json({
        quiz,
        questions: quizQuestions,
      });
    } catch (error) {
      console.error("Error fetching quiz questions:", error);
      res.status(500).json({ error: "Failed to fetch quiz questions" });
    }
  });

  // ============ ASSIGNMENT ROUTES ============

  // Get all assignments (teacher)
  app.get("/api/assignments", async (_req, res) => {
    try {
      const allAssignments = await storage.getAllAssignments();
      const assignmentsWithDetails = await Promise.all(
        allAssignments.map(async (assignment) => {
          const sections = await storage.getAssignmentSections(assignment.id);
          const sectionsWithParts = await Promise.all(
            sections.map(async (section) => {
              const parts = await storage.getAssignmentParts(section.id);
              const partsWithResources = await Promise.all(
                parts.map(async (part) => {
                  const resources = await storage.getAssignmentResources(part.id);
                  return { ...part, resources };
                })
              );
              return { ...section, parts: partsWithResources };
            })
          );
          return { ...assignment, sections: sectionsWithParts };
        })
      );
      res.json(assignmentsWithDetails);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      res.status(500).json({ error: "Failed to fetch assignments" });
    }
  });

  // Get published assignments (student)
  app.get("/api/assignments/active", async (_req, res) => {
    try {
      const publishedAssignments = await storage.getPublishedAssignments();
      res.json(publishedAssignments);
    } catch (error) {
      console.error("Error fetching published assignments:", error);
      res.status(500).json({ error: "Failed to fetch published assignments" });
    }
  });

  // Get single assignment with sections and parts
  app.get("/api/assignments/:id", async (req, res) => {
    try {
      const assignment = await storage.getAssignment(req.params.id);
      if (!assignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }

      const sections = await storage.getAssignmentSections(assignment.id);
      const sectionsWithParts = await Promise.all(
        sections.map(async (section) => {
          const parts = await storage.getAssignmentParts(section.id);
          const partsWithResources = await Promise.all(
            parts.map(async (part) => {
              const resources = await storage.getAssignmentResources(part.id);
              return { ...part, resources };
            })
          );
          return { ...section, parts: partsWithResources };
        })
      );

      res.json({ ...assignment, sections: sectionsWithParts });
    } catch (error) {
      console.error("Error fetching assignment:", error);
      res.status(500).json({ error: "Failed to fetch assignment" });
    }
  });

  // Create assignment (teacher)
  app.post("/api/assignments", async (req, res) => {
    try {
      const { year, title, totalMarks, totalTimeMinutes, isPublished } = req.body;
      const assignment = await storage.createAssignment({
        year,
        title,
        totalMarks: totalMarks || 40,
        totalTimeMinutes: totalTimeMinutes || 360,
        isPublished: isPublished ?? false, // Default to draft (unpublished)
      });
      res.json(assignment);
    } catch (error) {
      console.error("Error creating assignment:", error);
      res.status(500).json({ error: "Failed to create assignment" });
    }
  });

  // Update assignment (teacher)
  app.put("/api/assignments/:id", async (req, res) => {
    try {
      console.log("PUT assignment:", req.params.id, "with body:", JSON.stringify(req.body));
      const { id, createdAt, ...updateData } = req.body;
      const assignment = await storage.updateAssignment(req.params.id, updateData);
      console.log("PUT result:", assignment);
      res.json(assignment);
    } catch (error: any) {
      console.error("Error updating assignment:", error?.message || error);
      console.error("Error stack:", error?.stack);
      res.status(500).json({ error: "Failed to update assignment", details: error?.message });
    }
  });

  // Partial update assignment (teacher) - for checklist updates
  app.patch("/api/assignments/:id", async (req, res) => {
    try {
      console.log("PATCH assignment:", req.params.id, "with body:", JSON.stringify(req.body));
      const assignment = await storage.updateAssignment(req.params.id, req.body);
      console.log("PATCH result:", assignment);
      res.json(assignment);
    } catch (error: any) {
      console.error("Error updating assignment:", error?.message || error);
      res.status(500).json({ error: "Failed to update assignment", details: error?.message });
    }
  });

  // Delete assignment (teacher)
  app.delete("/api/assignments/:id", async (req, res) => {
    try {
      await storage.deleteAssignment(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting assignment:", error);
      res.status(500).json({ error: "Failed to delete assignment" });
    }
  });

  // Create assignment section
  app.post("/api/assignments/:assignmentId/sections", async (req, res) => {
    try {
      const { sectionType, title, isCompulsory, orderIndex, informationSheet } = req.body;
      const section = await storage.createAssignmentSection({
        assignmentId: req.params.assignmentId,
        sectionType,
        title,
        isCompulsory: isCompulsory ?? false,
        orderIndex: orderIndex ?? 0,
        informationSheet: informationSheet ?? null,
      });
      res.json(section);
    } catch (error) {
      console.error("Error creating section:", error);
      res.status(500).json({ error: "Failed to create section" });
    }
  });

  // Update assignment section
  app.put("/api/assignment-sections/:id", async (req, res) => {
    try {
      const section = await storage.updateAssignmentSection(req.params.id, req.body);
      res.json(section);
    } catch (error) {
      console.error("Error updating section:", error);
      res.status(500).json({ error: "Failed to update section" });
    }
  });

  // PATCH assignment section (partial update)
  app.patch("/api/assignment-sections/:id", async (req, res) => {
    try {
      console.log("PATCH section:", req.params.id, "with body:", JSON.stringify(req.body));
      const section = await storage.updateAssignmentSection(req.params.id, req.body);
      console.log("PATCH result:", section);
      res.json(section);
    } catch (error: any) {
      console.error("Error patching section:", error?.message || error);
      console.error("Error stack:", error?.stack);
      res.status(500).json({ error: "Failed to update section", details: error?.message });
    }
  });

  // Delete assignment section
  app.delete("/api/assignment-sections/:id", async (req, res) => {
    try {
      await storage.deleteAssignmentSection(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting section:", error);
      res.status(500).json({ error: "Failed to delete section" });
    }
  });

  // Create assignment part
  app.post("/api/assignment-sections/:sectionId/parts", async (req, res) => {
    try {
      const { partLabel, title, instructions, maxMarks, orderIndex, isPractical, aiGradingGuidance, subQuestions, inputStyle, contentBlocks, requiresUpload } = req.body;
      const part = await storage.createAssignmentPart({
        sectionId: req.params.sectionId,
        partLabel,
        title,
        instructions,
        contentBlocks,
        maxMarks: maxMarks ?? 0,
        orderIndex: orderIndex ?? 0,
        isPractical: isPractical ?? false,
        requiresUpload: requiresUpload ?? true,
        inputStyle: inputStyle ?? "text",
        aiGradingGuidance,
        subQuestions,
      });
      res.json(part);
    } catch (error) {
      console.error("Error creating part:", error);
      res.status(500).json({ error: "Failed to create part" });
    }
  });

  // Update assignment part
  app.put("/api/assignment-parts/:id", async (req, res) => {
    try {
      const part = await storage.updateAssignmentPart(req.params.id, req.body);
      res.json(part);
    } catch (error) {
      console.error("Error updating part:", error);
      res.status(500).json({ error: "Failed to update part" });
    }
  });

  // Delete assignment part
  app.delete("/api/assignment-parts/:id", async (req, res) => {
    try {
      await storage.deleteAssignmentPart(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting part:", error);
      res.status(500).json({ error: "Failed to delete part" });
    }
  });

  // Upload resource file for assignment part
  app.post("/api/assignment-parts/:partId/resources", assignmentUpload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const fileUrl = `/assets/${req.file.filename}`;
      const resource = await storage.createAssignmentResource({
        partId: req.params.partId,
        fileName: req.file.originalname,
        fileUrl,
        fileType: req.body.fileType || path.extname(req.file.originalname).slice(1),
        description: req.body.description,
      });
      res.json(resource);
    } catch (error) {
      console.error("Error uploading resource:", error);
      res.status(500).json({ error: "Failed to upload resource" });
    }
  });

  // Delete resource
  app.delete("/api/assignment-resources/:id", async (req, res) => {
    try {
      await storage.deleteAssignmentResource(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting resource:", error);
      res.status(500).json({ error: "Failed to delete resource" });
    }
  });

  // ============ STUDENT ASSIGNMENT ATTEMPT ROUTES ============

  // Start or get existing assignment attempt
  app.post("/api/assignment-attempts/start", async (req, res) => {
    try {
      const { assignmentId, localStudentId, chosenOptionalSection } = req.body;
      
      // Check for existing attempt
      const existing = await storage.getAssignmentAttemptByStudent(assignmentId, localStudentId);
      if (existing) {
        const student = await getStudentFromToken(req);
        if (student && !existing.studentId) {
          try {
            const updated = await storage.updateAssignmentAttempt(existing.id, { studentId: student.studentId });
            return res.json(updated);
          } catch (e) {
            console.error("Failed to link student to existing attempt:", e);
          }
        }
        return res.json(existing);
      }

      // Get assignment to get total time
      const assignment = await storage.getAssignment(assignmentId);
      if (!assignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }

      // Get sections to find first part
      const sections = await storage.getAssignmentSections(assignmentId);
      const sddSection = sections.find(s => s.sectionType === "sdd");
      let firstPartId = null;
      if (sddSection) {
        const parts = await storage.getAssignmentParts(sddSection.id);
        if (parts.length > 0) {
          firstPartId = parts.sort((a, b) => a.orderIndex - b.orderIndex)[0].id;
        }
      }

      // Extract studentId from auth token if present
      const student = await getStudentFromToken(req);

      const attemptData: any = {
        assignmentId,
        localStudentId,
        studentId: student?.studentId || null,
        chosenOptionalSection,
        status: "in_progress",
        timeRemainingSeconds: assignment.totalTimeMinutes * 60,
        currentSectionId: sddSection?.id || null,
        currentPartId: firstPartId,
      };
      const attempt = await storage.createAssignmentAttempt(attemptData);
      res.json(attempt);
    } catch (error) {
      console.error("Error starting attempt:", error);
      res.status(500).json({ error: "Failed to start attempt" });
    }
  });

  // Get attempt by ID
  app.get("/api/assignment-attempts/:id", async (req, res) => {
    try {
      const attempt = await storage.getAssignmentAttempt(req.params.id);
      if (!attempt) {
        return res.status(404).json({ error: "Attempt not found" });
      }
      res.json(attempt);
    } catch (error) {
      console.error("Error fetching attempt:", error);
      res.status(500).json({ error: "Failed to fetch attempt" });
    }
  });

  // Get all attempts for a student (syncs localStorage with server)
  app.get("/api/assignment-attempts/student/:studentId", async (req, res) => {
    try {
      const attempts = await storage.getAssignmentAttemptsByStudent(req.params.studentId);
      res.json(attempts);
    } catch (error) {
      console.error("Error fetching student attempts:", error);
      res.status(500).json({ error: "Failed to fetch student attempts" });
    }
  });

  // Update attempt (pause, resume, update time, complete part)
  app.put("/api/assignment-attempts/:id", async (req, res) => {
    try {
      const existingAttempt = await storage.getAssignmentAttempt(req.params.id);
      if (!existingAttempt) {
        return res.status(404).json({ error: "Attempt not found" });
      }
      
      if (req.body.completedPartIds) {
        const existingCompleted = existingAttempt.completedPartIds || [];
        const newCompleted = req.body.completedPartIds || [];
        
        if (newCompleted.length > existingCompleted.length + 1) {
          return res.status(403).json({ error: "Cannot skip parts. Complete them in order." });
        }
        
        for (const partId of existingCompleted) {
          if (!newCompleted.includes(partId)) {
            return res.status(403).json({ error: "Cannot remove completed parts." });
          }
        }
      }
      
      if (req.body.currentPartId !== undefined) {
        const sections = await storage.getAssignmentSections(existingAttempt.assignmentId);
        if (sections && sections.length > 0) {
          const relevantSections = sections.filter((s: { isCompulsory: boolean | null; sectionType: string }) => 
            s.isCompulsory || s.sectionType === existingAttempt.chosenOptionalSection
          ).sort((a: { orderIndex: number }, b: { orderIndex: number }) => a.orderIndex - b.orderIndex);
          
          const allPartsPromises = relevantSections.map(async (section: { id: string }) => {
            const parts = await storage.getAssignmentParts(section.id);
            return parts.sort((a: { orderIndex: number }, b: { orderIndex: number }) => a.orderIndex - b.orderIndex);
          });
          const partsArrays = await Promise.all(allPartsPromises);
          const allParts = partsArrays.flat();
          
          const completedPartIds = req.body.completedPartIds || existingAttempt.completedPartIds || [];
          const nextAllowedPart = allParts.find((p: { id: string }) => !completedPartIds.includes(p.id));
          
          if (req.body.currentPartId && nextAllowedPart && req.body.currentPartId !== nextAllowedPart.id) {
            const requestedIndex = allParts.findIndex((p: { id: string }) => p.id === req.body.currentPartId);
            const allowedIndex = allParts.findIndex((p: { id: string }) => p.id === nextAllowedPart.id);
            
            if (requestedIndex > allowedIndex) {
              return res.status(403).json({ error: "Cannot advance to a part that is not yet unlocked." });
            }
          }
        }
      }
      
      const attempt = await storage.updateAssignmentAttempt(req.params.id, req.body);
      res.json(attempt);
    } catch (error) {
      console.error("Error updating attempt:", error);
      res.status(500).json({ error: "Failed to update attempt" });
    }
  });

  // Get responses for an attempt
  app.get("/api/assignment-attempts/:attemptId/responses", async (req, res) => {
    try {
      const responses = await storage.getAssignmentResponses(req.params.attemptId);
      res.json(responses);
    } catch (error) {
      console.error("Error fetching responses:", error);
      res.status(500).json({ error: "Failed to fetch responses" });
    }
  });

  // Submit or update a response (with optional screenshot upload)
  app.post("/api/assignment-responses", assignmentUpload.array("screenshots", 10), async (req, res) => {
    try {
      const { attemptId, partId, subQuestionId, textAnswer, codeAnswer, drawingData, userInputs } = req.body;
      
      // Check if part is locked (already submitted)
      const attempt = await storage.getAssignmentAttempt(attemptId);
      if (attempt && attempt.completedPartIds?.includes(partId)) {
        return res.status(403).json({ error: "This part has been submitted and is locked. You cannot edit your answers." });
      }
      
      // Process uploaded screenshots
      const screenshotUrls: string[] = [];
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          screenshotUrls.push(`/assets/${file.filename}`);
        }
      }
      
      // Also include any existing screenshot URLs passed in body
      if (req.body.existingScreenshots) {
        const existing = JSON.parse(req.body.existingScreenshots);
        // Handle both string[] and object[] formats (with url property)
        for (const item of existing) {
          if (typeof item === "string") {
            screenshotUrls.push(item);
          } else if (item && typeof item === "object" && item.url) {
            screenshotUrls.push(item.url);
          }
        }
      }

      // Check for existing response
      const existingResponse = await storage.getAssignmentResponse(attemptId, partId, subQuestionId);
      
      if (existingResponse) {
        const updated = await storage.updateAssignmentResponse(existingResponse.id, {
          textAnswer,
          codeAnswer,
          screenshotUrls,
          drawingData,
          userInputs: userInputs ? JSON.parse(userInputs) : null,
        });
        return res.json(updated);
      }

      const response = await storage.createAssignmentResponse({
        attemptId,
        partId,
        subQuestionId,
        textAnswer,
        codeAnswer,
        screenshotUrls,
        drawingData,
        userInputs: userInputs ? JSON.parse(userInputs) : null,
      });
      res.json(response);
    } catch (error) {
      console.error("Error saving response:", error);
      res.status(500).json({ error: "Failed to save response" });
    }
  });

  // Grade assignment response with AI
  async function gradeOneResponse(
    response: any,
    opts: { aiGradingGuidance?: string; maxMarks: number; markingGuidanceData?: any; inputStyle?: string; inputConfig?: any }
  ): Promise<{ marks: number; feedback: string; suggestions: string }> {
    if (!response) throw new Error("Response not found");

    let inputStyle = opts.inputStyle || "";
    let assignmentPart: any = null;
    if (response.partId) {
      try {
        assignmentPart = await storage.getAssignmentPart(response.partId);
        if (assignmentPart && !inputStyle) inputStyle = assignmentPart.inputStyle || "";
      } catch (e) {
        console.error("Error looking up part:", e);
      }
    }

    let otherResponsesContext = "";
    try {
      const allResponses = await storage.getAssignmentResponses(response.attemptId);
      const siblingResponses = allResponses.filter(r => r.partId === response.partId && r.id !== response.id);
      if (siblingResponses.length > 0) {
        const subQuestions = (assignmentPart?.subQuestions as any[]) || [];
        const findSubQDeep = (qs: any[], id: string): any => {
          for (const q of qs) {
            if (q.id === id) return q;
            if (q.subParts && q.subParts.length > 0) {
              const found = findSubQDeep(q.subParts, id);
              if (found) return found;
            }
          }
          return null;
        };
        const contextParts: string[] = [];
        for (const sibling of siblingResponses) {
          const subQ = sibling.subQuestionId ? findSubQDeep(subQuestions, sibling.subQuestionId) : null;
          const label = subQ ? (subQ.questionLabel || subQ.title || sibling.subQuestionId) : sibling.subQuestionId;
          let content = "";
          if (sibling.textAnswer) content += sibling.textAnswer;
          if (sibling.codeAnswer) {
            const sibPartStyle = subQ?.inputStyle || "";
            if (sibPartStyle === "html-upload") {
              content += `\n\`\`\`html\n${sibling.codeAnswer}\n\`\`\``;
            } else if (sibPartStyle === "py-upload") {
              content += `\n\`\`\`python\n${sibling.codeAnswer}\n\`\`\``;
            } else {
              content += `\nCode:\n${sibling.codeAnswer}`;
            }
          }
          if (sibling.userInputs) content += `\n${JSON.stringify(sibling.userInputs, null, 2)}`;
          if (content.trim()) {
            contextParts.push(`Task ${label}: ${content.trim()}`);
          }
        }
        if (contextParts.length > 0) {
          otherResponsesContext = `\n--- STUDENT'S OTHER ANSWERS IN THIS PART (for context - use these to verify fitness-for-purpose claims and cross-reference the student's work) ---\n${contextParts.join("\n\n")}\n---\n`;
        }
      }
    } catch (e) {
      console.error("Error fetching sibling responses:", e);
    }

    let studentAnswer = "";
    if (response.textAnswer) studentAnswer += `Text Answer:\n${response.textAnswer}\n\n`;
    if (response.codeAnswer) {
      if (inputStyle === "html-upload") {
        studentAnswer += `HTML File Submission (review the code carefully for correctness, structure, and proper use of HTML tags):\n\`\`\`html\n${response.codeAnswer}\n\`\`\`\n\n`;
      } else if (inputStyle === "py-upload") {
        studentAnswer += `Python File Submission (review the Python code carefully for correctness, proper use of programming constructs, variable naming, input validation, and adherence to the task requirements):\n\`\`\`python\n${response.codeAnswer}\n\`\`\`\n\n`;
      } else {
        studentAnswer += `Code Submission:\n${response.codeAnswer}\n\n`;
      }
    }
    if (response.userInputs) {
      const inputs = response.userInputs as Record<string, any>;
      if ((inputStyle === "webpage-wireframe" || inputStyle === "form-wireframe") && inputs.drawing) {
        try {
          const wireframeItems = JSON.parse(inputs.drawing);
          if (Array.isArray(wireframeItems)) {
            const elements = wireframeItems.filter((item: any) => item.type !== "line").sort((a: any, b: any) => (a.y || 0) - (b.y || 0));
            const lines = wireframeItems.filter((item: any) => item.type === "line");
            studentAnswer += `${inputStyle === "form-wireframe" ? "Form" : "Webpage"} Wireframe Submission:\n`;
            studentAnswer += `Elements (in order from top to bottom):\n`;
            for (const el of elements) {
              const label = el.content || el.text || "(no label)";
              const typeMap: Record<string, string> = {
                "wf-heading": "HEADING", "wf-paragraph": "PARAGRAPH", "wf-audio": "AUDIO PLAYER",
                "wf-video": "VIDEO PLAYER", "wf-div": "CONTAINER/DIV", "wf-annotation": "ANNOTATION",
                "ui-image": "IMAGE", "ui-label": "LABEL", "ui-input": "TEXT INPUT",
                "ui-textarea": "TEXTAREA", "ui-dropdown": "DROPDOWN", "ui-radio": "RADIO",
                "ui-checkbox": "CHECKBOX", "ui-submit": "SUBMIT BUTTON",
                "link-text": "LINK", "bullet-text": "BULLET LIST", "numbered-text": "NUMBERED LIST",
                "text": "TEXT", "box": "BOX"
              };
              const elType = typeMap[el.type] || el.type?.toUpperCase() || "ELEMENT";
              studentAnswer += `  - [${elType}`;
              if (el.x !== undefined && el.y !== undefined) studentAnswer += ` at (${Math.round(el.x)}, ${Math.round(el.y)})`;
              if (el.width || el.height) studentAnswer += ` size ${el.width || "auto"}x${el.height || "auto"}`;
              studentAnswer += `: "${label}"]\n`;
            }
            if (lines.length > 0) {
              studentAnswer += `Connections/Lines: ${lines.length}\n`;
            }
            studentAnswer += `Total elements: ${elements.length}\n\n`;
          }
        } catch {
          studentAnswer += `Wireframe Data:\n${inputs.drawing}\n\n`;
        }
      } else if ((inputStyle === "drawing" || inputStyle === "structure-dataflow") && inputs.drawing) {
        try {
          const diagramItems = JSON.parse(inputs.drawing);
          if (!Array.isArray(diagramItems)) {
            studentAnswer += `Diagram Data:\n${inputs.drawing}\n\n`;
          } else {
            const shapeItems = diagramItems.filter((i: any) => i.type !== "line" && i.type !== "crowfoot" && i.type !== "dataflow-arrow");
            const lineItems = diagramItems.filter((i: any) => i.type === "line" || i.type === "crowfoot" || i.type === "dataflow-arrow");

            const sortedShapes = shapeItems.sort((a: any, b: any) => {
              if (Math.abs(a.y - b.y) > 40) return a.y - b.y;
              return a.x - b.x;
            });

            studentAnswer += `${inputStyle === "structure-dataflow" ? "Structure/Dataflow" : "Drawing/Diagram"} Submission:\n`;
            studentAnswer += `SHAPES:\n`;
            for (const i of sortedShapes) {
              const formatting: string[] = [];
              if (i.isBold) formatting.push("bold");
              if (i.isUnderline || i.type === "link-text") formatting.push("underlined");
              if (i.fontSize && i.fontSize !== "normal") formatting.push(`size-${i.fontSize}`);
              const formatStr = formatting.length > 0 ? `, formatting: ${formatting.join("+")}` : "";
              const posStr = `at approx (${Math.round(i.x)}, ${Math.round(i.y)})`;
              const baseTag = i.isBaseItem ? " [base]" : "";
              const shapeTypeMap: Record<string, string> = {
                "box": "BOX", "ellipse": "ELLIPSE", "diamond": "DIAMOND", "parallelogram": "PARALLELOGRAM",
                "circle": "CIRCLE", "cylinder": "CYLINDER", "hexagon": "HEXAGON", "trapezoid": "TRAPEZOID",
                "document": "DOCUMENT", "text": "TEXT", "bullet-text": "BULLET_LIST", "numbered-text": "NUMBERED_LIST",
              };
              const shapeLabel = shapeTypeMap[i.type] || i.type?.toUpperCase() || "SHAPE";

              if (i.type === "bullet-text" && i.content) {
                const bulletPoints = i.content.split("\n").filter((line: string) => line.trim());
                studentAnswer += `  [BULLET_LIST ${posStr}: ${bulletPoints.length} bullet points: ${bulletPoints.map((p: string, idx: number) => `${idx + 1}. "${p}"`).join(", ")}${formatStr}]\n`;
              } else if (i.type === "numbered-text" && i.content) {
                const numberedItems = i.content.split("\n").filter((line: string) => line.trim());
                studentAnswer += `  [NUMBERED_LIST ${posStr}: ${numberedItems.length} numbered items: ${numberedItems.map((p: string, idx: number) => `${idx + 1}. "${p}"`).join(", ")}${formatStr}]\n`;
              } else {
                const sizeStr = i.width && i.height ? `, size: ${Math.round(i.width)}x${Math.round(i.height)}` : "";
                studentAnswer += `  [${shapeLabel}${baseTag} ${posStr}${sizeStr}: "${i.content || ''}"${formatStr}]\n`;
              }
            }

            if (lineItems.length > 0) {
              studentAnswer += `CONNECTIONS:\n`;
              for (const i of lineItems) {
                const getLabel = (id: string | undefined) => {
                  if (!id) return "?";
                  const target = diagramItems.find((t: any) => t.id === id);
                  return target?.content || target?.entityName || target?.type || "?";
                };
                if (i.type === "dataflow-arrow") {
                  const dir = i.dataflowDirection || "up";
                  const semantic = dir === "up" ? "DATA-IN" : "DATA-OUT";
                  const origin = i.originFunctionId ? getLabel(i.originFunctionId) : "?";
                  const label = diagramItems.find((t: any) => t.attachedArrowId === i.id)?.content || "";
                  studentAnswer += `  [${semantic} (arrow ${dir}) for function "${origin}"${label ? `, label: "${label}"` : ""}]\n`;
                } else if (i.type === "crowfoot") {
                  const oneEntity = i.connectedTo1 ? getLabel(i.connectedTo1) : "?";
                  const manyEntity = i.connectedTo2 ? getLabel(i.connectedTo2) : "?";
                  const label = i.relationshipLabel ? `, label: "${i.relationshipLabel}"` : "";
                  studentAnswer += `  [CROWFOOT: "${oneEntity}" (ONE) to "${manyEntity}" (MANY)${label}]\n`;
                } else {
                  const from = i.connectedTo1 ? getLabel(i.connectedTo1) : `(${Math.round(i.x)},${Math.round(i.y)})`;
                  const to = i.connectedTo2 ? getLabel(i.connectedTo2) : `(${Math.round(i.x2 || 0)},${Math.round(i.y2 || 0)})`;
                  const arrows = [];
                  if (i.arrowStart) arrows.push("arrow-start");
                  if (i.arrowEnd) arrows.push("arrow-end");
                  const arrowStr = arrows.length > 0 ? `, ${arrows.join("+")}` : "";
                  studentAnswer += `  [LINE from "${from}" to "${to}"${arrowStr}]\n`;
                }
              }
            }
            studentAnswer += `\n`;
          }
        } catch {
          studentAnswer += `Diagram Data:\n${inputs.drawing}\n\n`;
        }
      } else if (inputStyle === "erd-annotation" && (inputs.erd_diagram || inputs.drawing)) {
        try {
          const diagramData = inputs.erd_diagram || inputs.drawing;
          const diagramItems = JSON.parse(diagramData);
          if (!Array.isArray(diagramItems)) {
            studentAnswer += `ERD Diagram Data:\n${diagramData}\n\n`;
          } else {
            const descriptions: string[] = [];
            descriptions.push("ERD Annotation Submission:");

            if (opts.inputConfig?.erdAttributes) {
              descriptions.push("Attribute Markings:");
              for (const attr of opts.inputConfig.erdAttributes) {
                const studentItem = diagramItems.find((item: any) => item.id === attr.id);
                const marking = studentItem?.marking || "none";
                const markingLabel = marking === "primary" ? "Primary Key (PK)" : marking === "foreign" ? "Foreign Key (FK)" : "None";
                descriptions.push(`  ${attr.entityName}.${attr.attributeName}: ${markingLabel}`);
              }
            }

            const erdEntities = diagramItems.filter((item: any) => item.type === "erd-entity");
            if (erdEntities.length > 0) {
              descriptions.push("ERD Entities:");
              for (const entity of erdEntities) {
                const entityName = entity.entityName || "Unnamed Entity";
                const isStudentAdded = !entity.isBaseItem;
                descriptions.push(`  Entity: ${entityName}${isStudentAdded ? " (student added)" : ""}`);
                if (entity.attributes && entity.attributes.length > 0) {
                  for (const attr of entity.attributes) {
                    const markingLabel = attr.marking === "primary" ? " [PK - underlined]" :
                                        attr.marking === "foreign" ? " [FK - asterisk]" : "";
                    descriptions.push(`    - ${attr.name || "unnamed"}${markingLabel}`);
                  }
                }
              }
            }

            const addedAttrs = diagramItems.filter((item: any) =>
              (item.type === "ellipse" || item.type === "text") && !item.isBaseItem && item.content
            );
            if (addedAttrs.length > 0) {
              descriptions.push("Added Attributes (shapes):");
              for (const attr of addedAttrs) {
                descriptions.push(`  ${attr.content}`);
              }
            }

            const getEntityName = (itemId: string | undefined): string => {
              if (!itemId) return "unknown";
              const item = diagramItems.find((i: any) => i.id === itemId);
              if (!item) return "unknown";
              if (item.type === "erd-entity") return item.entityName || "unnamed entity";
              if (item.type === "box" || item.type === "cylinder") return item.content || "unnamed";
              return "unknown";
            };

            const addedLines = diagramItems.filter((item: any) => item.type === "line" && !item.isBaseItem);
            if (addedLines.length > 0) {
              descriptions.push("Added Relationship Lines:");
              for (const line of addedLines) {
                const label = line.relationshipLabel ? `"${line.relationshipLabel}"` : "(no label)";
                const from = getEntityName(line.connectedTo1);
                const to = getEntityName(line.connectedTo2);
                descriptions.push(`  Line from "${from}" to "${to}", label: ${label}`);
              }
            }

            const addedCrowfoots = diagramItems.filter((item: any) => item.type === "crowfoot" && !item.isBaseItem);
            if (addedCrowfoots.length > 0) {
              descriptions.push("Added 1:M Relationships (crowfoot lines):");
              for (const line of addedCrowfoots) {
                const label = line.relationshipLabel ? `"${line.relationshipLabel}"` : "(no label)";
                const oneEntity = getEntityName(line.connectedTo1);
                const manyEntity = getEntityName(line.connectedTo2);
                descriptions.push(`  Crowfoot line: "${oneEntity}" (ONE side) ---> "${manyEntity}" (MANY side), label: ${label}`);
              }
            }

            studentAnswer += descriptions.join("\n") + "\n\n";
          }
        } catch {
          studentAnswer += `ERD Diagram Data:\n${inputs.erd_diagram || inputs.drawing}\n\n`;
        }
      } else if (inputStyle === "design-choice") {
        const designMode = inputs.design_mode || "pseudocode";
        if (designMode === "pseudocode" && inputs.main) {
          studentAnswer += `Design Answer (Pseudocode):\n${inputs.main}\n\n`;
        } else if (designMode === "diagram" && inputs.drawing) {
          try {
            const diagramItems = JSON.parse(inputs.drawing);
            if (!Array.isArray(diagramItems)) {
              studentAnswer += `Design Diagram Data:\n${inputs.drawing}\n\n`;
            } else {
              const shapes = diagramItems.filter((i: any) => i.type !== "line" && i.type !== "crowfoot" && i.type !== "dataflow-arrow");
              const sortedShapes = shapes.sort((a: any, b: any) => {
                if (Math.abs(a.y - b.y) > 40) return a.y - b.y;
                return a.x - b.x;
              });
              studentAnswer += `Design Answer (Structure Diagram):\nSHAPES:\n`;
              for (const i of sortedShapes) {
                const posStr = `at approx (${Math.round(i.x)}, ${Math.round(i.y)})`;
                const baseTag = i.isBaseItem ? " [base]" : "";
                const shapeTypeMap: Record<string, string> = {
                  "box": "BOX", "ellipse": "ELLIPSE", "diamond": "DIAMOND", "text": "TEXT",
                };
                const shapeLabel = shapeTypeMap[i.type] || i.type?.toUpperCase() || "SHAPE";
                const sizeStr = i.width && i.height ? `, size: ${Math.round(i.width)}x${Math.round(i.height)}` : "";
                studentAnswer += `  [${shapeLabel}${baseTag} ${posStr}${sizeStr}: "${i.content || ''}"]\n`;
              }
              const lines = diagramItems.filter((i: any) => i.type === "line");
              if (lines.length > 0) {
                studentAnswer += `CONNECTIONS:\n`;
                for (const i of lines) {
                  const getLabel = (id: string | undefined) => {
                    if (!id) return "?";
                    const target = diagramItems.find((t: any) => t.id === id);
                    return target?.content || "?";
                  };
                  const from = i.connectedTo1 ? getLabel(i.connectedTo1) : "?";
                  const to = i.connectedTo2 ? getLabel(i.connectedTo2) : "?";
                  studentAnswer += `  [LINE from "${from}" to "${to}"]\n`;
                }
              }
              studentAnswer += `\n`;
            }
          } catch {
            studentAnswer += `Design Diagram Data:\n${inputs.drawing}\n\n`;
          }
        } else if (inputs.main) {
          studentAnswer += `Design Answer:\n${inputs.main}\n\n`;
        }
      } else if (inputStyle === "nav-structure" && inputs.drawing) {
        try {
          const diagramItems = JSON.parse(inputs.drawing);
          if (Array.isArray(diagramItems)) {
            const pages = diagramItems.filter((item: any) => item.type === "nav-page" || item.type === "box");
            const lines = diagramItems.filter((item: any) => item.type === "line");
            studentAnswer += `Navigation Structure Diagram Submission:\n`;
            studentAnswer += `Pages/Objects present:\n`;
            for (const page of pages) {
              studentAnswer += `  - "${page.content || "(no label)"}" (type: ${page.type}, id: ${page.id})\n`;
            }
            studentAnswer += `Links/Connections:\n`;
            for (const line of lines) {
              const fromPage = pages.find((p: any) => p.id === line.connectedTo1);
              const toPage = pages.find((p: any) => p.id === line.connectedTo2);
              const arrowType = line.arrowStart && line.arrowEnd ? "two-way link (double arrow)" 
                : line.arrowEnd ? "one-way link (single arrow)" 
                : line.arrowStart ? "one-way link (reverse arrow)" 
                : "line (no arrows)";
              studentAnswer += `  - "${fromPage?.content || line.connectedTo1 || "?"}" → "${toPage?.content || line.connectedTo2 || "?"}" [${arrowType}]\n`;
            }
            studentAnswer += `\nFull diagram data:\n${inputs.drawing}\n\n`;
          }
        } catch {
          studentAnswer += `Navigation Structure Diagram Data:\n${inputs.drawing}\n\n`;
        }
      } else if (inputs.uploaded_files) {
        try {
          const files = JSON.parse(inputs.uploaded_files);
          if (Array.isArray(files)) {
            for (const file of files) {
              if (file.type === "code" && file.content) {
                const ext = file.name?.split('.').pop()?.toLowerCase() || '';
                const lang = ext === 'py' ? 'python' : ext === 'html' || ext === 'htm' ? 'html' : ext === 'css' ? 'css' : '';
                const content = typeof file.content === 'string' && file.content.length > 50000
                  ? file.content.substring(0, 50000) + '\n... (file truncated)'
                  : file.content;
                studentAnswer += `Uploaded File (${file.name}):\n\`\`\`${lang}\n${content}\n\`\`\`\n\n`;
              } else if (file.type === "screenshot" && file.url) {
                studentAnswer += `Uploaded Screenshot: ${file.name}\n`;
              }
            }
          }
        } catch {}
        const { uploaded_files, drawing_canvas: _dc, ...restInputs } = inputs;
        if (Object.keys(restInputs).length > 0) {
          studentAnswer += `Question Answers:\n${JSON.stringify(restInputs, null, 2)}\n\n`;
        }
      } else {
        const { drawing_canvas, ...safeInputs } = inputs;
        studentAnswer += `Question Answers:\n${JSON.stringify(safeInputs, null, 2)}\n\n`;
      }
    }

    const screenshotUrls = response.screenshotUrls || [];
    const hasScreenshots = screenshotUrls.length > 0;
    if (hasScreenshots) {
      studentAnswer += `Attachments: ${screenshotUrls.length} file(s) attached for analysis (images or documents).\n`;
    }

    let fullGuidance = opts.aiGradingGuidance || "Grade based on accuracy and completeness.";
    if (opts.markingGuidanceData && opts.markingGuidanceData.rows && opts.markingGuidanceData.rows.length > 0) {
      fullGuidance += `\n\n--- DETAILED MARKING CRITERIA ---\n`;
      opts.markingGuidanceData.rows.forEach((row: any, index: number) => {
        fullGuidance += `\nCriterion ${index + 1} (${row.marks} mark${row.marks !== 1 ? 's' : ''}):\n`;
        fullGuidance += `  Expected Response: ${row.expectedResponse}\n`;
        if (row.additionalGuidance) {
          fullGuidance += `  Additional Guidance: ${row.additionalGuidance}\n`;
        }
      });
      if (opts.markingGuidanceData.exampleAnswer) {
        fullGuidance += `\n--- EXAMPLE FULL-MARKS ANSWER ---\n${opts.markingGuidanceData.exampleAnswer}`;
      }
    }

    if ((inputStyle === "webpage-wireframe" || inputStyle === "form-wireframe") && opts.inputConfig?.wireframeExampleData) {
      try {
        const exampleItems = JSON.parse(opts.inputConfig.wireframeExampleData);
        if (Array.isArray(exampleItems)) {
          const exElements = exampleItems.filter((item: any) => item.type !== "line").sort((a: any, b: any) => (a.y || 0) - (b.y || 0));
          fullGuidance += `\n\n--- EXPECTED ${inputStyle === "form-wireframe" ? "FORM" : "WEBPAGE"} WIREFRAME (Teacher's Example) ---\n`;
          fullGuidance += `Expected elements (in order from top to bottom):\n`;
          const typeMap: Record<string, string> = {
            "wf-heading": "HEADING", "wf-paragraph": "PARAGRAPH", "wf-audio": "AUDIO PLAYER",
            "wf-video": "VIDEO PLAYER", "wf-div": "CONTAINER/DIV", "wf-annotation": "ANNOTATION",
            "ui-image": "IMAGE", "ui-label": "LABEL", "ui-input": "TEXT INPUT",
            "ui-textarea": "TEXTAREA", "ui-dropdown": "DROPDOWN", "ui-radio": "RADIO",
            "ui-checkbox": "CHECKBOX", "ui-submit": "SUBMIT BUTTON",
            "link-text": "LINK", "bullet-text": "BULLET LIST", "numbered-text": "NUMBERED LIST",
            "text": "TEXT", "box": "BOX"
          };
          for (const el of exElements) {
            const label = el.content || el.text || "(no label)";
            const elType = typeMap[el.type] || el.type?.toUpperCase() || "ELEMENT";
            fullGuidance += `  - [${elType}`;
            if (el.x !== undefined && el.y !== undefined) fullGuidance += ` at (${Math.round(el.x)}, ${Math.round(el.y)})`;
            if (el.width || el.height) fullGuidance += ` size ${el.width || "auto"}x${el.height || "auto"}`;
            fullGuidance += `: "${label}"]\n`;
          }
          fullGuidance += `Total expected elements: ${exElements.length}\n`;
          fullGuidance += `\nCompare the student's wireframe against this expected layout. Check:\n`;
          fullGuidance += `1. Are all required element TYPES present (match HEADING to HEADING, IMAGE to IMAGE, etc.)?\n`;
          fullGuidance += `2. Are the elements in approximately the correct vertical order?\n`;
          fullGuidance += `3. Are the elements appropriately labeled for the context?\n`;
          fullGuidance += `4. Award marks for each correctly identified element type in the right position.\n`;
        }
      } catch {
        fullGuidance += `\n\n--- EXPECTED WIREFRAME ---\n${opts.inputConfig.wireframeExampleData}\n`;
      }
    }

    if (inputStyle === "nav-structure" && opts.inputConfig?.navExampleData) {
      try {
        const exampleItems = JSON.parse(opts.inputConfig.navExampleData);
        if (Array.isArray(exampleItems)) {
          const exPages = exampleItems.filter((item: any) => item.type === "nav-page" || item.type === "box");
          const exLines = exampleItems.filter((item: any) => item.type === "line");
          fullGuidance += `\n\n--- EXPECTED NAVIGATION STRUCTURE (Teacher's Example Diagram) ---\n`;
          fullGuidance += `Expected pages/objects:\n`;
          for (const page of exPages) {
            fullGuidance += `  - "${page.content || "(no label)"}" (type: ${page.type})\n`;
          }
          fullGuidance += `Expected links/connections:\n`;
          for (const line of exLines) {
            const fromPage = exPages.find((p: any) => p.id === line.connectedTo1);
            const toPage = exPages.find((p: any) => p.id === line.connectedTo2);
            const arrowType = line.arrowStart && line.arrowEnd ? "two-way link (double arrow)" 
              : line.arrowEnd ? "one-way link (single arrow)" 
              : line.arrowStart ? "one-way link (reverse arrow)" 
              : "line (no arrows)";
            fullGuidance += `  - "${fromPage?.content || "?"}" → "${toPage?.content || "?"}" [${arrowType}]\n`;
          }
          fullGuidance += `\nCompare the student's diagram against this expected structure. Check:\n`;
          fullGuidance += `1. Are all required pages/objects present with correct labels?\n`;
          fullGuidance += `2. Are all required links present between the correct pages?\n`;
          fullGuidance += `3. Are the arrow types correct (one-way vs two-way links)?\n`;
        }
      } catch {
        fullGuidance += `\n\n--- EXPECTED NAVIGATION STRUCTURE ---\n${opts.inputConfig.navExampleData}\n`;
      }
    }

    const exampleFilesContent = readExampleFileContents(opts.markingGuidanceData?.exampleFiles || []);
    if (exampleFilesContent) {
      fullGuidance += exampleFilesContent;
    }

    const markingGuidanceImageUrls: string[] = opts.markingGuidanceData?.exampleImages || [];
    const hasGuidanceImages = markingGuidanceImageUrls.length > 0;

    const gradingPrompt = `You are grading a Computing Science assignment response.

GRADING GUIDANCE:
${fullGuidance}

MAXIMUM MARKS: ${opts.maxMarks}

STUDENT'S SUBMISSION:
${studentAnswer}
${otherResponsesContext}
${hasScreenshots ? "IMPORTANT: Carefully examine all attached files (screenshots, images, documents, PDFs). Read any text visible in the images or documents (including code, output, or results) and use that information in your grading." : ""}
${hasGuidanceImages ? "IMPORTANT: The teacher has provided example screenshot(s) showing what a correct answer should look like. Use these reference images to help grade the student's answer." : ""}
${otherResponsesContext ? "IMPORTANT: When the student discusses 'fitness for purpose' or evaluates whether their code/database/website meets requirements, cross-reference their claims against their actual submissions shown in the context above. Check if their self-assessment is accurate based on their actual work." : ""}

Please provide:
1. Marks awarded (out of ${opts.maxMarks})
2. Detailed feedback explaining what was correct and what could be improved
3. Specific suggestions for improvement

Format your response as JSON:
{
  "marks": <number>,
  "feedback": "<detailed feedback>",
  "suggestions": "<improvement suggestions>"
}`;

    let result;
    if (gemini) {
      try {
        const contentParts: any[] = [{ text: gradingPrompt }];

        if (hasGuidanceImages) {
          for (const imgUrl of markingGuidanceImageUrls) {
            try {
              const relativePath = imgUrl.replace(/^\/assets\//, "");
              let filePath = path.join(process.cwd(), "public", "assets", relativePath);
              if (!fs.existsSync(filePath)) {
                filePath = path.join(process.cwd(), "attached_assets", relativePath);
              }
              if (fs.existsSync(filePath)) {
                const fileBuffer = fs.readFileSync(filePath);
                const base64Data = fileBuffer.toString("base64");
                const ext = path.extname(imgUrl).toLowerCase();
                let mimeType = "image/jpeg";
                if (ext === ".png") mimeType = "image/png";
                else if (ext === ".gif") mimeType = "image/gif";
                else if (ext === ".webp") mimeType = "image/webp";
                contentParts.push({ inlineData: { data: base64Data, mimeType } });
              }
            } catch (fileError) {
              console.error("Error reading marking guidance image:", fileError);
            }
          }
        }

        if (hasScreenshots) {
          for (const fileUrl of screenshotUrls) {
            try {
              const url = typeof fileUrl === "string" ? fileUrl : (fileUrl as any).url;
              if (!url) continue;
              const relativePath = url.replace(/^\/assets\//, "");
              let filePath = path.join(process.cwd(), "public", "assets", relativePath);
              if (!fs.existsSync(filePath)) {
                filePath = path.join(process.cwd(), "attached_assets", relativePath);
              }
              if (fs.existsSync(filePath)) {
                const fileBuffer = fs.readFileSync(filePath);
                const base64Data = fileBuffer.toString("base64");
                const ext = path.extname(url).toLowerCase();
                let mimeType = "image/jpeg";
                if (ext === ".png") mimeType = "image/png";
                else if (ext === ".gif") mimeType = "image/gif";
                else if (ext === ".webp") mimeType = "image/webp";
                else if (ext === ".pdf") mimeType = "application/pdf";
                else if (ext === ".doc") mimeType = "application/msword";
                else if (ext === ".docx") mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                contentParts.push({ inlineData: { data: base64Data, mimeType } });
              }
            } catch (fileError) {
              console.error("Error reading file for AI grading:", fileError);
            }
          }
        }

        const diagramInputStyles = ["drawing", "structure-dataflow", "erd-annotation", "form-wireframe", "webpage-wireframe", "nav-structure", "design-choice"];
        const isDiagramQuestion = diagramInputStyles.includes(inputStyle || "");
        if (isDiagramQuestion && response.userInputs) {
          const inputs = response.userInputs as Record<string, any>;
          const canvasData = inputs.drawing_canvas || inputs.erd_drawing;
          if (canvasData && typeof canvasData === "string" && canvasData.startsWith("data:")) {
            const imgData = canvasData.replace(/^data:image\/\w+;base64,/, "");
            contentParts.push({ inlineData: { data: imgData, mimeType: "image/png" } });
            contentParts[0] = { text: gradingPrompt + "\n\nIMPORTANT: A screenshot of the student's diagram is attached as the last image. Use this visual to verify the layout, connections, labels, and overall structure of their diagram answer." };
          }
        }

        const geminiResponse = await gemini.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts: contentParts }],
          config: { responseMimeType: "application/json" }
        });
        result = JSON.parse(geminiResponse.text || "{}");
      } catch (geminiError) {
        console.error("Gemini grading error:", geminiError);
        const groqResponse = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: gradingPrompt }],
          response_format: { type: "json_object" },
        });
        result = JSON.parse(groqResponse.choices[0]?.message?.content || "{}");
      }
    } else {
      const groqResponse = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: gradingPrompt }],
        response_format: { type: "json_object" },
      });
      result = JSON.parse(groqResponse.choices[0]?.message?.content || "{}");
    }

    const normFb = (val: any): string => {
      if (!val) return "";
      if (typeof val === "string") return val;
      if (Array.isArray(val)) return val.map(String).join("\n");
      return String(val);
    };
    const fb = normFb(result.feedback);
    const sg = normFb(result.suggestions);

    await storage.updateAssignmentResponse(response.id, {
      marksAwarded: result.marks || 0,
      aiFeedback: `${fb}\n\nSuggestions: ${sg}`,
    });

    return {
      marks: result.marks || 0,
      feedback: fb,
      suggestions: sg,
    };
  }

  app.post("/api/assignment-responses/:id/grade", async (req, res) => {
    try {
      const { aiGradingGuidance, maxMarks, markingGuidanceData, inputStyle } = req.body;

      const responseObj = await storage.getAssignmentResponseById(req.params.id);
      if (!responseObj) {
        return res.status(404).json({ error: "Response not found" });
      }

      const result = await gradeOneResponse(responseObj, {
        aiGradingGuidance,
        maxMarks,
        markingGuidanceData,
        inputStyle,
      });
      res.json(result);
    } catch (error) {
      console.error("Error grading response:", error);
      res.status(500).json({ error: "Failed to grade response" });
    }
  });

  app.post("/api/assignment-attempts/:id/grade-all", async (req, res) => {
    try {
      const attempt = await storage.getAssignmentAttempt(req.params.id);
      if (!attempt) {
        return res.status(404).json({ error: "Attempt not found" });
      }

      const assignment = await storage.getAssignment(attempt.assignmentId);
      if (!assignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }

      const sections = await storage.getAssignmentSections(assignment.id);
      const relevantSections = sections
        .filter((s: { isCompulsory: boolean | null; sectionType: string }) =>
          s.isCompulsory || s.sectionType === attempt.chosenOptionalSection
        )
        .sort((a: { orderIndex: number }, b: { orderIndex: number }) => a.orderIndex - b.orderIndex);

      const allParts: any[] = [];
      for (const section of relevantSections) {
        const parts = await storage.getAssignmentParts(section.id);
        for (const part of parts.sort((a: { orderIndex: number }, b: { orderIndex: number }) => a.orderIndex - b.orderIndex)) {
          allParts.push({ ...part, sectionTitle: (section as any).title || (section as any).sectionType });
        }
      }

      const allResponses = await storage.getAssignmentResponses(attempt.id);

      const flattenLeafQuestions = (qs: any[]): any[] => {
        const leaves: any[] = [];
        for (const q of qs) {
          if (q.subParts && q.subParts.length > 0) {
            leaves.push(...flattenLeafQuestions(q.subParts));
          } else {
            leaves.push(q);
          }
        }
        return leaves;
      };

      type GradeItem = { maxMarks: number; score: number; result: any };

      const gradeOneItem = async (
        response: any,
        maxMarks: number,
        opts: { aiGradingGuidance: string; markingGuidanceData: any; inputStyle: string; inputConfig?: any },
        resultBase: any
      ): Promise<GradeItem> => {
        if (!response || maxMarks === 0) {
          return {
            maxMarks,
            score: 0,
            result: {
              ...resultBase,
              maxMarks,
              score: 0,
              userAnswer: response ? buildUserAnswer(response) : null,
              feedback: maxMarks === 0 ? "This question is not graded automatically." : "No answer was provided.",
              suggestions: "",
            },
          };
        }

        let gradeResult = { marks: 0, feedback: "", suggestions: "" };

        if (response.marksAwarded !== null && response.aiFeedback) {
          gradeResult = {
            marks: response.marksAwarded,
            feedback: response.aiFeedback.replace(/\n\nSuggestions:.*$/s, ""),
            suggestions: response.aiFeedback.match(/Suggestions: (.*)$/s)?.[1] || "",
          };
        } else {
          try {
            gradeResult = await gradeOneResponse(response, {
              aiGradingGuidance: opts.aiGradingGuidance,
              maxMarks,
              markingGuidanceData: opts.markingGuidanceData,
              inputStyle: opts.inputStyle,
              inputConfig: opts.inputConfig || null,
            });
          } catch (gradeError) {
            console.error("Error grading question:", gradeError);
            gradeResult = { marks: 0, feedback: "Grading failed for this question.", suggestions: "" };
          }
        }

        return {
          maxMarks,
          score: gradeResult.marks || 0,
          result: {
            ...resultBase,
            maxMarks,
            score: gradeResult.marks || 0,
            userAnswer: buildUserAnswer(response),
            feedback: gradeResult.feedback || "",
            suggestions: gradeResult.suggestions || "",
          },
        };
      };

      const allGradePromises: Promise<GradeItem[]>[] = allParts.map(async (part) => {
        const subQuestions = (part.subQuestions as any[]) || [];

        if (subQuestions.length > 0) {
          const leafQuestions = flattenLeafQuestions(subQuestions);

          const promises = leafQuestions.map((subQ) => {
            const response = allResponses.find(
              (r: any) => r.partId === part.id && r.subQuestionId === subQ.id
            );
            const maxMarks = subQ.maxMarks || 0;

            return gradeOneItem(
              response,
              maxMarks,
              {
                aiGradingGuidance: subQ.aiGuidance || part.aiGradingGuidance || "",
                markingGuidanceData: subQ.markingGuidanceData || null,
                inputStyle: subQ.inputStyle || part.inputStyle || "text",
                inputConfig: subQ.inputConfig || null,
              },
              {
                partLabel: part.partLabel,
                sectionTitle: part.sectionTitle,
                questionLabel: subQ.questionLabel || subQ.label || subQ.title || "",
                questionText: subQ.questionText || "",
                contentBlocks: subQ.contentBlocks || [],
              }
            );
          });

          return Promise.all(promises);
        } else {
          const response = allResponses.find((r: any) => r.partId === part.id && !r.subQuestionId);
          const maxMarks = part.maxMarks || 0;

          const item = await gradeOneItem(
            response,
            maxMarks,
            {
              aiGradingGuidance: part.aiGradingGuidance || "",
              markingGuidanceData: null,
              inputStyle: part.inputStyle || "text",
            },
            {
              partLabel: part.partLabel,
              sectionTitle: part.sectionTitle,
              questionLabel: "",
              questionText: part.instructions || "",
              contentBlocks: part.contentBlocks || [],
            }
          );

          return [item];
        }
      });

      const allGradeResults = await Promise.all(allGradePromises);

      let totalScore = 0;
      let totalMaxMarks = 0;
      const results: any[] = [];

      for (const partResults of allGradeResults) {
        for (const { maxMarks, score, result } of partResults) {
          totalMaxMarks += maxMarks;
          totalScore += score;
          results.push(result);
        }
      }

      res.json({
        assignmentTitle: assignment.title,
        totalScore,
        maxScore: totalMaxMarks,
        breakdown: results,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error in batch grading:", error);
      res.status(500).json({ error: "Failed to grade assignment" });
    }
  });

  /* ── /api/n5/* — unambiguous routes for the teacher dashboard native panels ─────
     These paths avoid the route-shadowing caused by Higher CS registering the same
     generic paths (/api/questions, /api/assignments, /api/custom-quizzes) first.   */

  /* DELETE a single N5 question */
  app.delete("/api/n5/questions/:id", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token || !sessions.has(token)) return res.status(401).json({ error: "Unauthorized" });
      await storage.deleteQuestion(req.params.id);
      res.json({ ok: true });
    } catch (error) {
      console.error("N5 delete question error:", error);
      res.status(500).json({ error: "Failed to delete question" });
    }
  });

  /* GET all N5 custom quizzes (teacher) */
  app.get("/api/n5/custom-quizzes", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token || !sessions.has(token)) return res.status(401).json({ error: "Unauthorized" });
      const quizzes = await storage.getAllCustomQuizzes();
      res.json(quizzes);
    } catch (error) {
      console.error("N5 get quizzes error:", error);
      res.status(500).json({ error: "Failed to fetch quizzes" });
    }
  });

  /* PATCH a N5 custom quiz (e.g. toggle isActive) */
  app.patch("/api/n5/custom-quizzes/:id", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token || !sessions.has(token)) return res.status(401).json({ error: "Unauthorized" });
      const quiz = await storage.updateCustomQuiz(req.params.id, req.body);
      res.json(quiz);
    } catch (error) {
      console.error("N5 patch quiz error:", error);
      res.status(500).json({ error: "Failed to update quiz" });
    }
  });

  /* DELETE a N5 custom quiz */
  app.delete("/api/n5/custom-quizzes/:id", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token || !sessions.has(token)) return res.status(401).json({ error: "Unauthorized" });
      await storage.deleteCustomQuiz(req.params.id);
      res.json({ ok: true });
    } catch (error) {
      console.error("N5 delete quiz error:", error);
      res.status(500).json({ error: "Failed to delete quiz" });
    }
  });

  /* GET all N5 assignments (teacher) */
  app.get("/api/n5/assignments", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token || !sessions.has(token)) return res.status(401).json({ error: "Unauthorized" });
      const allAssignments = await storage.getAllAssignments();
      const withSections = await Promise.all(
        allAssignments.map(async (a) => {
          const sections = await storage.getAssignmentSections(a.id);
          return { ...a, sectionCount: sections.length };
        })
      );
      res.json(withSections);
    } catch (error) {
      console.error("N5 get assignments error:", error);
      res.status(500).json({ error: "Failed to fetch assignments" });
    }
  });

  /* POST create a N5 assignment */
  app.post("/api/n5/assignments", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token || !sessions.has(token)) return res.status(401).json({ error: "Unauthorized" });
      const { title, description } = req.body;
      if (!title || !title.trim()) return res.status(400).json({ error: "Title required" });
      const assignment = await storage.createAssignment({ title: title.trim(), description: description || null, isPublished: false } as any);
      res.status(201).json(assignment);
    } catch (error) {
      console.error("N5 create assignment error:", error);
      res.status(500).json({ error: "Failed to create assignment" });
    }
  });

  /* PATCH a N5 assignment (title / isPublished) */
  app.patch("/api/n5/assignments/:id", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token || !sessions.has(token)) return res.status(401).json({ error: "Unauthorized" });
      const assignment = await storage.updateAssignment(req.params.id, req.body);
      res.json(assignment);
    } catch (error) {
      console.error("N5 patch assignment error:", error);
      res.status(500).json({ error: "Failed to update assignment" });
    }
  });

  /* DELETE a N5 assignment */
  app.delete("/api/n5/assignments/:id", async (req, res) => {
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (!token || !sessions.has(token)) return res.status(401).json({ error: "Unauthorized" });
      await storage.deleteAssignment(req.params.id);
      res.json({ ok: true });
    } catch (error) {
      console.error("N5 delete assignment error:", error);
      res.status(500).json({ error: "Failed to delete assignment" });
    }
  });

}

function buildUserAnswer(response: any): any {
  const parts: string[] = [];
  if (response.textAnswer) parts.push(response.textAnswer);
  if (response.codeAnswer) parts.push(response.codeAnswer);
  if (response.userInputs && typeof response.userInputs === "object") {
    return response.userInputs;
  }
  if (response.drawingData) parts.push("[Diagram submitted]");
  if (response.screenshotUrls && response.screenshotUrls.length > 0) {
    parts.push(`[${response.screenshotUrls.length} file(s) uploaded]`);
  }
  return parts.join("\n") || null;
}

// Helper function to migrate a subQuestion to use content blocks
function migrateSubQuestion(subQ: any, subQIdx: number): any {
  // Check if already has content blocks
  if (subQ.contentBlocks && subQ.contentBlocks.length > 0) {
    // Still need to migrate subParts if they exist
    if (subQ.subParts && subQ.subParts.length > 0) {
      const migratedSubParts = subQ.subParts.map((part: any, partIdx: number) => 
        migrateSubPart(part, subQIdx, partIdx)
      );
      return { ...subQ, subParts: migratedSubParts };
    }
    return subQ;
  }

  // Check if any legacy fields exist
  const hasLegacy = subQ.questionText || subQ.imageUrl || subQ.codeSnippet || subQ.preCodeText;
  if (!hasLegacy) {
    // Still need to migrate subParts if they exist
    if (subQ.subParts && subQ.subParts.length > 0) {
      const migratedSubParts = subQ.subParts.map((part: any, partIdx: number) => 
        migrateSubPart(part, subQIdx, partIdx)
      );
      return { ...subQ, subParts: migratedSubParts };
    }
    return subQ;
  }

  // Build content blocks from legacy fields
  const newBlocks: any[] = [];
  const idPrefix = `cb-${subQIdx}-${Date.now()}`;

  // 1. questionText as text block
  if (subQ.questionText) {
    newBlocks.push({
      id: `${idPrefix}-txt`,
      type: "text",
      content: subQ.questionText
    });
  }

  // 2. imageUrl as image block
  if (subQ.imageUrl) {
    newBlocks.push({
      id: `${idPrefix}-img`,
      type: "image",
      content: subQ.imageUrl,
      caption: subQ.imageCaption || "",
      imageSize: "medium"
    });
  }

  // 3. preCodeText as text block
  if (subQ.preCodeText) {
    newBlocks.push({
      id: `${idPrefix}-pre`,
      type: "text",
      content: subQ.preCodeText
    });
  }

  // 4. codeSnippet as code block
  if (subQ.codeSnippet) {
    newBlocks.push({
      id: `${idPrefix}-code`,
      type: "code",
      content: subQ.codeSnippet
    });
  }

  // Migrate subParts if they exist
  let migratedSubParts = subQ.subParts;
  if (subQ.subParts && subQ.subParts.length > 0) {
    migratedSubParts = subQ.subParts.map((part: any, partIdx: number) => 
      migrateSubPart(part, subQIdx, partIdx)
    );
  }

  return {
    ...subQ,
    contentBlocks: newBlocks,
    subParts: migratedSubParts
  };
}

// Helper function to migrate a subPart to use content blocks
function migrateSubPart(part: any, subQIdx: number, partIdx: number): any {
  // Skip if content blocks already exist
  if (part.contentBlocks && part.contentBlocks.length > 0) return part;

  // Check if any legacy fields exist
  const hasLegacy = part.questionText || part.imageUrl || part.codeSnippet || part.preCodeText;
  if (!hasLegacy) return part;

  // Build content blocks from legacy fields
  const newBlocks: any[] = [];
  const idPrefix = `cb-${subQIdx}-${partIdx}-${Date.now()}`;

  // 1. questionText as text block
  if (part.questionText) {
    newBlocks.push({
      id: `${idPrefix}-txt`,
      type: "text",
      content: part.questionText
    });
  }

  // 2. imageUrl as image block
  if (part.imageUrl) {
    newBlocks.push({
      id: `${idPrefix}-img`,
      type: "image",
      content: part.imageUrl,
      caption: part.imageCaption || "",
      imageSize: "medium"
    });
  }

  // 3. preCodeText as text block
  if (part.preCodeText) {
    newBlocks.push({
      id: `${idPrefix}-pre`,
      type: "text",
      content: part.preCodeText
    });
  }

  // 4. codeSnippet as code block
  if (part.codeSnippet) {
    newBlocks.push({
      id: `${idPrefix}-code`,
      type: "code",
      content: part.codeSnippet
    });
  }

  return {
    ...part,
    contentBlocks: newBlocks
  };
}
