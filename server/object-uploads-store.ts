import path from 'path';
import { promises as fsp } from 'fs';
import type { Response } from 'express';
import { objectStorageClient } from './replit_integrations/object_storage/objectStorage';

let cachedBucket: ReturnType<typeof objectStorageClient.bucket> | null = null;
function getBucket() {
  if (cachedBucket) return cachedBucket;
  const id = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
  if (!id) {
    throw new Error(
      'DEFAULT_OBJECT_STORAGE_BUCKET_ID is not set. Object Storage must be ' +
      'provisioned for uploads to work.'
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

export function isLegalLeafName(name: string): boolean {
  if (!name) return false;
  if (name.includes('/') || name.includes('\\')) return false;
  if (name.includes('..')) return false;
  if (name.startsWith('.')) return false;
  return true;
}

export interface SavedUpload {
  key: string;
}

// Persist an in-memory upload at <prefix><key> in the configured bucket. The
// caller chooses the URL surface — we just give them back the generated key.
export async function saveBufferToBucket(
  prefix: string,
  buffer: Buffer,
  originalname: string,
  contentType: string | undefined,
): Promise<SavedUpload> {
  const key = makeStorageKey(originalname);
  await getBucket().file(prefix + key).save(buffer, {
    contentType: contentType || 'application/octet-stream',
    resumable: false,
    metadata: { contentType: contentType || 'application/octet-stream' },
  });
  return { key };
}

// Stream <prefix><name> from the bucket to the response. If the object is
// missing, fall through to the supplied disk paths in order. Used to give
// `/assets/...` and `/resources/...` a "bucket first, git-tracked disk file
// second" shape so existing checked-in resources keep working without a
// re-upload while every new upload lands in object storage.
export async function streamObjectOrFallback(
  prefix: string,
  name: string,
  res: Response,
  fallbackDiskPaths: string[] = [],
  opts: { cacheMaxAgeSeconds?: number; forcedContentType?: string } = {},
): Promise<void> {
  if (!isLegalLeafName(name)) { res.status(400).send('Bad request'); return; }
  const cache = opts.cacheMaxAgeSeconds ?? 86400;
  try {
    const file = getBucket().file(prefix + name);
    const [exists] = await file.exists();
    if (exists) {
      const [metadata] = await file.getMetadata();
      const ct = opts.forcedContentType || (metadata.contentType as string) || 'application/octet-stream';
      res.set({ 'Content-Type': ct, 'Cache-Control': `public, max-age=${cache}` });
      if (metadata.size != null) res.set('Content-Length', String(metadata.size));
      file.createReadStream()
        .on('error', (err) => {
          console.error('[object-store] stream error for', prefix + name, err);
          if (!res.headersSent) res.status(500).end();
        })
        .pipe(res);
      return;
    }
  } catch (err) {
    console.error('[object-store] bucket lookup failed for', prefix + name, err);
    // Fall through to disk fallback below.
  }
  for (const candidate of fallbackDiskPaths) {
    try {
      await fsp.access(candidate);
      if (opts.forcedContentType) res.set('Content-Type', opts.forcedContentType);
      res.set('Cache-Control', `public, max-age=${cache}`);
      res.sendFile(candidate);
      return;
    } catch { /* try next candidate */ }
  }
  res.status(404).send('Not found');
}

export async function readBucketObjectAsBuffer(key: string): Promise<Buffer | null> {
  try {
    const file = getBucket().file(key);
    const [exists] = await file.exists();
    if (!exists) return null;
    const [contents] = await file.download();
    return contents;
  } catch (err) {
    console.error('[object-store] read failed for', key, err);
    return null;
  }
}

export async function readBucketObjectAsString(key: string): Promise<string | null> {
  const buf = await readBucketObjectAsBuffer(key);
  return buf ? buf.toString('utf8') : null;
}

export async function writeBucketObjectFromString(
  key: string,
  body: string,
  contentType = 'application/json',
): Promise<void> {
  await getBucket().file(key).save(Buffer.from(body, 'utf8'), {
    contentType,
    resumable: false,
    metadata: { contentType },
  });
}

export async function deleteBucketObject(key: string): Promise<void> {
  try {
    await getBucket().file(key).delete({ ignoreNotFound: true } as any);
  } catch (err) {
    console.error('[object-store] delete failed for', key, err);
  }
}

export async function listBucketKeys(prefix: string): Promise<string[]> {
  const [files] = await getBucket().getFiles({ prefix });
  return files.map((f) => f.name);
}
