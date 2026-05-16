import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

// Resolve to the OS-canonical case for this folder so Next's workspace-root
// detection doesn't pick up the stray parent-directory package-lock.json.
const here = fs.realpathSync.native(
  path.dirname(fileURLToPath(import.meta.url)),
);

const nextConfig: NextConfig = {
  outputFileTracingRoot: here,
};

export default nextConfig;
