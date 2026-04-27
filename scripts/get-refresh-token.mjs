/**
 * Run this script to generate a new Google OAuth refresh token.
 *
 * Usage:
 *   1. Set your credentials below (from your Google Cloud Console OAuth client)
 *   2. Run: node scripts/get-refresh-token.mjs
 *   3. Open the URL printed in your terminal and authorize access
 *   4. Paste the auth code when prompted
 *   5. Copy the refresh_token printed at the end
 *   6. Update Supabase secret:
 *      supabase secrets set GOOGLE_REFRESH_TOKEN="<paste token here>"
 *   7. Redeploy functions:
 *      supabase functions deploy calendar-availability --no-verify-jwt
 *      supabase functions deploy book-call --no-verify-jwt
 */

import { createInterface } from "readline";

// ── Paste your values from Google Cloud Console ──────────────────────────────
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "PASTE_YOUR_CLIENT_ID_HERE";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "PASTE_YOUR_CLIENT_SECRET_HERE";
// ─────────────────────────────────────────────────────────────────────────────

const REDIRECT_URI = "urn:ietf:wg:oauth:2.0:oob";
const SCOPES = "https://www.googleapis.com/auth/calendar";

const authUrl =
  `https://accounts.google.com/o/oauth2/v2/auth` +
  `?client_id=${encodeURIComponent(CLIENT_ID)}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=code` +
  `&scope=${encodeURIComponent(SCOPES)}` +
  `&access_type=offline` +
  `&prompt=consent`;

console.log("\n=== UGCFire: Get Google Refresh Token ===\n");
console.log("1. Open this URL in your browser:\n");
console.log(authUrl);
console.log("\n2. Sign in with the Google account that owns your calendar.");
console.log("3. After authorizing, Google will show a code. Paste it below.\n");

const rl = createInterface({ input: process.stdin, output: process.stdout });
rl.question("Paste the authorization code: ", async (code) => {
  rl.close();

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: code.trim(),
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  const data = await res.json();

  if (data.error) {
    console.error("\n❌ Error:", data.error, data.error_description);
    process.exit(1);
  }

  console.log("\n✅ Success! Here is your refresh token:\n");
  console.log(data.refresh_token);
  console.log("\nNow run:\n");
  console.log(`  supabase secrets set GOOGLE_REFRESH_TOKEN="${data.refresh_token}"`);
  console.log("  supabase functions deploy calendar-availability --no-verify-jwt");
  console.log("  supabase functions deploy book-call --no-verify-jwt\n");
});
