import path from 'path';
import os from 'os';
import { promises as fsp } from 'fs';
import type { Response } from 'express';
import { objectStorageClient } from './replit_integrations/object_storage/objectStorage';

const OBJECT_PREFIX = 'classwork-uploads/';

let cachedBucket: ReturnType<typeof objectStorageClient.bucket> | null = null;
function getBucket() {
  if (cachedBucket) return cachedBucket;
  const id = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
  if (!id) {
    throw new Error(
      'DEFAULT_OBJECT_STORAGE_BUCKET_ID is not set. Object Storage must be ' +
      'provisioned for classwork uploads to work.'
    );
  }
  cachedBucket = objectStorageClient.bucket(id);
  return cachedBucket;
}

function safeFilename(originalname: string): string {
  return path.basename(originalname).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60);
}

function makeStorageKey(originalname: string): string {
  const stamp = Date.now() + '_' + Math.round(Math.random() * 1e9);
  return stamp + '_' + safeFilename(originalname);
}

// Reject anything that could escape the prefix or hit a dotfile.
function isLegalLeafName(name: string): boolean {
  if (!name) return false;
  if (name.includes('/') || name.includes('\\')) return false;
  if (name.includes('..')) return false;
  if (name.startsWith('.')) return false;
  return true;
}

export interface SavedClassworkUpload {
  key: string;
  url: string;
}

// Persist an uploaded file to Object Storage and return the public URL we serve
// it at. Same /classwork-uploads/<key> URL surface as before so existing prompt
// references in the database keep working.
export async function saveClassworkUpload(
  buffer: Buffer,
  originalname: string,
  contentType: string | undefined,
): Promise<SavedClassworkUpload> {
  const key = makeStorageKey(originalname);
  await getBucket().file(OBJECT_PREFIX + key).save(buffer, {
    contentType: contentType || 'application/octet-stream',
    resumable: false,
    metadata: { contentType: contentType || 'application/octet-stream' },
  });
  return { key, url: `/classwork-uploads/${key}` };
}

// Stream a stored upload to the response, or return a 404. We pipe through
// Express rather than redirecting to a signed GCS URL so the public URL stays
// stable forever.
export async function streamClassworkUpload(name: string, res: Response): Promise<void> {
  if (!isLegalLeafName(name)) {
    res.status(400).send('Bad request');
    return;
  }
  try {
    const file = getBucket().file(OBJECT_PREFIX + name);
    const [exists] = await file.exists();
    if (!exists) { res.status(404).send('Not found'); return; }
    const [metadata] = await file.getMetadata();
    res.set({
      'Content-Type': (metadata.contentType as string) || 'application/octet-stream',
      'Cache-Control': 'public, max-age=86400',
    });
    if (metadata.size != null) res.set('Content-Length', String(metadata.size));
    file.createReadStream()
      .on('error', (err) => {
        console.error('[classwork-uploads] stream error:', err);
        if (!res.headersSent) res.status(500).end();
      })
      .pipe(res);
  } catch (err) {
    console.error('[classwork-uploads] serve from object storage failed:', err);
    if (!res.headersSent) res.status(500).send('Server error');
  }
}

export interface DownloadedUpload {
  path: string;
  cleanup: () => Promise<void>;
}

// Download a /classwork-uploads/<file> URL into a temp file on local disk so
// callers (LibreOffice, JSZip, Gemini Vision) that need a real file path can
// keep working unchanged. Caller MUST invoke cleanup() in a finally block.
export async function downloadClassworkUploadToTemp(fileUrl: string): Promise<DownloadedUpload | null> {
  let p = fileUrl;
  try { const u = new URL(fileUrl); p = u.pathname; } catch { /* already a path */ }
  if (!p.startsWith('/classwork-uploads/')) return null;
  const name = path.basename(p);
  if (!isLegalLeafName(name)) return null;
  try {
    const file = getBucket().file(OBJECT_PREFIX + name);
    const [exists] = await file.exists();
    if (!exists) return null;
    const tmpPath = path.join(
      os.tmpdir(),
      `classwork_${Date.now()}_${Math.random().toString(36).slice(2)}_${safeFilename(name)}`,
    );
    await file.download({ destination: tmpPath });
    return {
      path: tmpPath,
      cleanup: async () => { try { await fsp.unlink(tmpPath); } catch { /* best-effort */ } },
    };
  } catch (err) {
    console.error('[classwork-uploads] download to temp failed:', err);
    return null;
  }
}
