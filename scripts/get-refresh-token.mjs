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

/**
 * Usage — two steps:
 *
 * Step 1: Print the auth URL (no args)
 *   node scripts/get-refresh-token.mjs
 *
 * Step 2: Exchange the code you got from Google
 *   node scripts/get-refresh-token.mjs YOUR_CODE_HERE
 */

// Pass credentials via env vars — never commit real values here.
// Usage: GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=xxx node scripts/get-refresh-token.mjs
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const REDIRECT_URI = "https://developers.google.com/oauthplayground";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("\n❌ Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET as env vars before running.\n");
  process.exit(1);
}
const SCOPES = "https://www.googleapis.com/auth/calendar";

const code = process.argv[2];

if (!code) {
  // Step 1 — print auth URL
  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${encodeURIComponent(CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(SCOPES)}` +
    `&access_type=offline` +
    `&prompt=consent`;

  console.log("\n=== UGCFire: Step 1 — Open this URL in your browser ===\n");
  console.log(authUrl);
  console.log("\nSign in with the Google account that owns your UGCFire calendar.");
  console.log("After clicking Allow, copy the code= value from the URL you land on.");
  console.log("\nThen run:  node scripts/get-refresh-token.mjs YOUR_CODE_HERE\n");
} else {
  // Step 2 — exchange code for refresh token
  console.log("\nExchanging code for refresh token…");

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
    console.error("\n❌ Error:", data.error, "-", data.error_description);
    console.error("The code may have expired (they last ~60 seconds). Run step 1 again.\n");
    process.exit(1);
  }

  console.log("\n✅ Success! Updating Supabase secret now…\n");
  console.log("Refresh token:", data.refresh_token);

  // Auto-update the Supabase secret
  const { execSync } = await import("child_process");
  try {
    execSync(
      `supabase secrets set GOOGLE_REFRESH_TOKEN="${data.refresh_token}" --project-ref yawgvntvhpgittvntihx`,
      { stdio: "inherit", cwd: process.cwd() }
    );
    console.log("\n✅ Supabase secret updated!");

    execSync("supabase functions deploy calendar-availability --no-verify-jwt", { stdio: "inherit", cwd: process.cwd() });
    execSync("supabase functions deploy book-call --no-verify-jwt", { stdio: "inherit", cwd: process.cwd() });
    console.log("\n✅ Functions redeployed. Calendar is now live!\n");
  } catch {
    console.log("\nRun these manually if the above failed:");
    console.log(`  supabase secrets set GOOGLE_REFRESH_TOKEN="${data.refresh_token}"`);
    console.log("  supabase functions deploy calendar-availability --no-verify-jwt");
    console.log("  supabase functions deploy book-call --no-verify-jwt\n");
  }
}
