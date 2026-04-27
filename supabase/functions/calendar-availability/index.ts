import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

async function getAccessToken(): Promise<string> {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
  const refreshToken = Deno.env.get("GOOGLE_REFRESH_TOKEN")!;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to refresh token: ${err}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const calendarId = Deno.env.get("GOOGLE_CALENDAR_ID")!;
    const timezone = Deno.env.get("GOOGLE_TIMEZONE") ?? "America/New_York";

    // Accept date param (?date=2026-05-05) or default to today
    const url = new URL(req.url);
    const dateParam = url.searchParams.get("date");

    const targetDate = dateParam ? new Date(dateParam) : new Date();
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, "0");
    const day = String(targetDate.getDate()).padStart(2, "0");

    // Check freeBusy for the entire target day
    const timeMin = `${year}-${month}-${day}T00:00:00Z`;
    const timeMax = `${year}-${month}-${day}T23:59:59Z`;

    const accessToken = await getAccessToken();

    const freeBusyRes = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        timeMin,
        timeMax,
        timeZone: timezone,
        items: [{ id: calendarId }],
      }),
    });

    if (!freeBusyRes.ok) {
      const err = await freeBusyRes.text();
      throw new Error(`FreeBusy query failed: ${err}`);
    }

    const freeBusyData = await freeBusyRes.json();
    const busySlots: { start: string; end: string }[] =
      freeBusyData?.calendars?.[calendarId]?.busy ?? [];

    // Generate candidate slots: 10:00, 10:30, 11:00, 13:00, 13:30, 14:00, 14:30, 15:00
    const candidateHours = [
      { hour: 10, minute: 0 },
      { hour: 10, minute: 30 },
      { hour: 11, minute: 0 },
      { hour: 13, minute: 0 },
      { hour: 13, minute: 30 },
      { hour: 14, minute: 0 },
      { hour: 14, minute: 30 },
      { hour: 15, minute: 0 },
    ];

    const available = candidateHours
      .map(({ hour, minute }) => {
        const hStr = String(hour).padStart(2, "0");
        const mStr = String(minute).padStart(2, "0");
        const slotStart = new Date(`${year}-${month}-${day}T${hStr}:${mStr}:00Z`);
        const slotEnd = new Date(slotStart.getTime() + 20 * 60 * 1000); // 20-min slots

        const isBusy = busySlots.some((busy) => {
          const bs = new Date(busy.start);
          const be = new Date(busy.end);
          return slotStart < be && slotEnd > bs;
        });

        const label12h = new Intl.DateTimeFormat("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          timeZone: timezone,
        }).format(slotStart);

        return { iso: slotStart.toISOString(), label: label12h, available: !isBusy };
      })
      .filter((s) => s.available);

    return new Response(
      JSON.stringify({ date: `${year}-${month}-${day}`, slots: available }),
      {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
