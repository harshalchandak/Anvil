import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";

export type ApiSuccess<T> = { ok: true; data: T };
export type ApiFailure = { ok: false; error: string; details?: unknown };

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json<ApiSuccess<T>>({ ok: true, data }, { status });
}

export function apiError(error: string, status = 400, details?: unknown) {
  return NextResponse.json<ApiFailure>(
    details === undefined ? { ok: false, error } : { ok: false, error, details },
    { status },
  );
}

export async function parseJson<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return { ok: false, response: apiError("Body must be valid JSON", 400) };
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return {
      ok: false,
      response: apiError("Invalid request body", 400, parsed.error.issues),
    };
  }
  return { ok: true, data: parsed.data };
}
