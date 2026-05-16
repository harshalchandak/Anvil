import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

const BUCKET = "carousels";

let cached: SupabaseClient | null = null;
function admin() {
  cached ??= createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );
  return cached;
}

export async function ensureBucket() {
  const client = admin();
  const { data: buckets, error } = await client.storage.listBuckets();
  if (error) throw new Error(`listBuckets failed: ${error.message}`);
  if (!buckets.find((b) => b.name === BUCKET)) {
    const create = await client.storage.createBucket(BUCKET, { public: false });
    if (create.error) {
      throw new Error(`createBucket failed: ${create.error.message}`);
    }
  }
}

export async function uploadCarouselSlide(args: {
  carouselId: string;
  slideNumber: number;
  png: Buffer;
}): Promise<string> {
  const path = `${args.carouselId}/slide-${args.slideNumber}.png`;
  const { error } = await admin()
    .storage.from(BUCKET)
    .upload(path, args.png, {
      contentType: "image/png",
      upsert: true,
    });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  return path;
}

export async function downloadCarouselSlide(path: string): Promise<Buffer> {
  const { data, error } = await admin().storage.from(BUCKET).download(path);
  if (error) throw new Error(`Storage download failed: ${error.message}`);
  return Buffer.from(await data.arrayBuffer());
}

export function bucketName() {
  return BUCKET;
}
