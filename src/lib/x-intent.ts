// X Web Intent: opens the X composer pre-filled. Costs nothing, needs no API.
// The user clicks Post inside the X composer themselves — that's why this
// approach works without any developer account / OAuth / tokens.

const INTENT_BASE = "https://x.com/intent/post";

/** Build an X compose URL for a single post. */
export function buildXIntentUrl(opts: {
  text: string;
  /** Hashtags WITHOUT the leading # symbol. X adds them automatically. */
  hashtags?: string[];
  /** Optional link to append; X also handles its own URL shortening. */
  url?: string;
}): string {
  const params = new URLSearchParams();
  params.set("text", opts.text);
  if (opts.hashtags && opts.hashtags.length > 0) {
    params.set("hashtags", opts.hashtags.join(","));
  }
  if (opts.url) params.set("url", opts.url);
  return `${INTENT_BASE}?${params.toString()}`;
}

/**
 * Build one intent URL per part of a thread. Web Intent can't auto-chain
 * replies — the user posts each one and replies the next to the previous.
 */
export function buildThreadIntentUrls(parts: string[]): string[] {
  return parts.map((text) => buildXIntentUrl({ text }));
}
