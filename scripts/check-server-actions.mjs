// Fails if `next build` exposed any server action outside the allowlist.
// Every exported function in a "use server" file becomes a public POST endpoint,
// so each one listed here must authenticate the caller itself (or be sign-in/up).
// Run after `next build`: node scripts/check-server-actions.mjs
import { readFileSync } from "node:fs";

const ALLOWED = new Set([
  // lib/actions/auth.actions.ts (public by design)
  "signUpWithEmail",
  "signInWithEmail",
  "signOut",
  // lib/actions/demo.actions.ts (public by design, rate-limited per IP)
  "signInAsDemo",
  // lib/actions/verification.actions.ts (session required, rate-limited per user)
  "resendVerificationEmail",
  // lib/actions/finnhub.actions.ts (session required)
  "searchStocks",
  // lib/actions/watchlist.actions.ts (session required)
  "addToWatchlist",
  "removeFromWatchlist",
  "getUserWatchlist",
  "getWatchlistWithData",
]);

const manifestPath = ".next/server/server-reference-manifest.json";
let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
} catch {
  console.error(`Cannot read ${manifestPath}. Run \`next build\` first.`);
  process.exit(2);
}

const exposed = Object.values(manifest.node ?? {}).map((a) => ({
  name: a.exportedName,
  file: a.filename,
}));
const unexpected = exposed.filter((a) => !ALLOWED.has(a.name));

if (unexpected.length > 0) {
  console.error("Unexpected public server actions:");
  for (const a of unexpected) console.error(`  - ${a.name} (${a.file})`);
  process.exit(1);
}

console.log(`OK: ${exposed.length} server actions, all allowlisted.`);
