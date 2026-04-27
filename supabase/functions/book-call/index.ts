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

interface BookingRequest {
  slotIso: string;       // ISO start time e.g. "2026-05-05T10:00:00Z"
  name: string;
  email: string;
  brandName?: string;
  message?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  try {
    const body: BookingRequest = await req.json();
    const { slotIso, name, email, brandName, message } = body;

    if (!slotIso || !name || !email) {
      return new Response(
        JSON.stringify({ error: "slotIso, name, and email are required" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const calendarId = Deno.env.get("GOOGLE_CALENDAR_ID")!;
    const timezone = Deno.env.get("GOOGLE_TIMEZONE") ?? "America/New_York";

    const startTime = new Date(slotIso);
    const endTime = new Date(startTime.getTime() + 20 * 60 * 1000); // 20-minute call

    const accessToken = await getAccessToken();

    const eventPayload = {
      summary: `UGCFire Discovery Call — ${name}`,
      description: [
        `Discovery call booked via UGCFire.com`,
        brandName ? `Brand: ${brandName}` : null,
        message ? `Message: ${message}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      start: { dateTime: startTime.toISOString(), timeZone: timezone },
      end: { dateTime: endTime.toISOString(), timeZone: timezone },
      attendees: [{ email }],
      conferenceData: {
        createRequest: {
          requestId: `ugcfire-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 60 },
          { method: "popup", minutes: 15 },
        ],
      },
    };

    const createRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1&sendUpdates=all`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventPayload),
      }
    );

    if (!createRes.ok) {
      const err = await createRes.text();
      throw new Error(`Failed to create event: ${err}`);
    }

    const event = await createRes.json();
    const meetLink: string | undefined =
      event?.conferenceData?.entryPoints?.find(
        (ep: { entryPointType: string; uri: string }) => ep.entryPointType === "video"
      )?.uri;

    return new Response(
      JSON.stringify({
        success: true,
        eventId: event.id,
        eventLink: event.htmlLink,
        meetLink: meetLink ?? null,
        start: event.start.dateTime,
        end: event.end.dateTime,
      }),
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
