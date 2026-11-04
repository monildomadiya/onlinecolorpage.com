import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { serverEnv } from '@/lib/env';
import { cdnUrl } from './urls';

let cached: S3Client | null = null;

/** Cloudflare R2 speaks the S3 API, so the AWS SDK works as-is. */
export function r2(): S3Client {
  if (cached) return cached;

  cached = new S3Client({
    region: 'auto',
    endpoint: `https://${serverEnv.r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: serverEnv.r2AccessKeyId,
      secretAccessKey: serverEnv.r2SecretAccessKey,
    },
  });

  return cached;
}

export function bucket(): string {
  return serverEnv.r2Bucket;
}

/** CDN (or proxy) URL for a key, resolved with the server-side public base. */
export function publicUrl(key: string | null | undefined): string {
  return cdnUrl(key, serverEnv.r2PublicBase);
}

/* ------------------------------------------------------------------ */
/*  key builders - one scheme for the whole bucket                     */
/* ------------------------------------------------------------------ */

const SAFE = /[^a-z0-9._-]+/g;

function safeName(name: string): string {
  return name.toLowerCase().replace(SAFE, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'file';
}

/** `pages/2026/11/<slug>-<rand>.png` */
export function buildKey(
  folder: 'pages' | 'thumbs' | 'pdfs' | 'refs' | 'covers' | 'site',
  name: string,
  ext: string,
): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 8);
  const clean = ext.replace(/^\.+/, '').toLowerCase();
  return `${folder}/${yyyy}/${mm}/${safeName(name)}-${rand}.${clean}`;
}

/* ------------------------------------------------------------------ */
/*  operations                                                         */
/* ------------------------------------------------------------------ */

export interface PutOptions {
  key: string;
  body: Buffer | Uint8Array | string;
  contentType: string;
  /** Default is one immutable year - keys are content-addressed by a random suffix. */
  cacheControl?: string;
  metadata?: Record<string, string>;
}

export async function putObject({
  key,
  body,
  contentType,
  cacheControl = 'public, max-age=31536000, immutable',
  metadata,
}: PutOptions): Promise<{ key: string; size: number }> {
  const buf = typeof body === 'string' ? Buffer.from(body) : Buffer.from(body);

  await r2().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: buf,
      ContentType: contentType,
      CacheControl: cacheControl,
      Metadata: metadata,
    }),
  );

  return { key, size: buf.byteLength };
}

export async function getObject(key: string) {
  return r2().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
}

/** Whole object as a Buffer. Used by the PDF builder and the download route. */
export async function getObjectBuffer(key: string): Promise<Buffer> {
  const res = await getObject(key);
  const bytes = await res.Body!.transformToByteArray();
  return Buffer.from(bytes);
}

export async function headObject(key: string) {
  try {
    return await r2().send(new HeadObjectCommand({ Bucket: bucket(), Key: key }));
  } catch {
    return null;
  }
}

export async function deleteObject(key: string): Promise<void> {
  await r2().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
}

export async function deleteObjects(keys: string[]): Promise<void> {
  const list = keys.filter(Boolean);
  if (list.length === 0) return;

  // S3 DeleteObjects caps out at 1000 keys per call.
  for (let i = 0; i < list.length; i += 1000) {
    await r2().send(
      new DeleteObjectsCommand({
        Bucket: bucket(),
        Delete: { Objects: list.slice(i, i + 1000).map((Key) => ({ Key })), Quiet: true },
      }),
    );
  }
}

export async function listObjects(prefix: string, limit = 1000) {
  const res = await r2().send(
    new ListObjectsV2Command({ Bucket: bucket(), Prefix: prefix, MaxKeys: limit }),
  );
  return res.Contents ?? [];
}

/** Short-lived signed GET, for private objects when no public base is set. */
export async function presignGet(key: string, expiresIn = 3600): Promise<string> {
  return getSignedUrl(r2(), new GetObjectCommand({ Bucket: bucket(), Key: key }), { expiresIn });
}

/** Signed PUT so a browser can upload straight to R2 when files get large. */
export async function presignPut(
  key: string,
  contentType: string,
  expiresIn = 900,
): Promise<string> {
  return getSignedUrl(
    r2(),
    new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: contentType }),
    { expiresIn },
  );
}
