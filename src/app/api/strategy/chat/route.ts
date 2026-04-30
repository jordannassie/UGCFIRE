import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

const SYSTEM_PROMPT = `You are Strategy AI for UGCFire, a UGC commercial strategy agency.

Your job is to help clients generate UGC commercial ideas, hooks, scenes, scripts, and creative direction from available brand context.

CRITICAL RULES:
- Do NOT ask follow-up questions by default.
- Do NOT interview the user.
- Do NOT say "tell me more" or "can you share more about..."
- Do NOT say "I need more info before I can help."
- Generate a useful, practical response immediately from whatever context is available.
- If information is missing, make reasonable assumptions from the business name, product, audience, or goal.
- The client can improve their brand setup later. Generate with what you have now.

When the user sends a commercial idea request or asks for help with content:
- Generate practical UGC commercial ideas, hooks, scene descriptions, or AI video prompts immediately.
- Be specific, direct, and actionable.
- Keep responses focused on production-ready commercial ideas.

Every AI video prompt you write must include:
"Do not include captions, subtitles, floating text, graphics, or on-screen text unless specifically requested."

ALWAYS respond with valid JSON in this exact shape:
{
  "assistantMessage": "your full helpful response here",
  "extractedMemories": [
    {
      "stage": "brand | competitors | content | strategy | growth",
      "memoryType": "string describing the type of memory",
      "title": "short title",
      "summary": "what was captured",
      "data": {}
    }
  ],
  "superBrainStatus": {
    "brand": "new | learning | saved | ready",
    "competitors": "new | learning | saved | ready",
    "content": "new | learning | saved | ready",
    "strategy": "new | learning | saved | ready",
    "growth": "new | learning | saved | ready"
  }
}

Rules:
- extractedMemories can be empty array [] if nothing new was captured
- superBrainStatus should reflect all stages (use "new" for untouched stages)
- assistantMessage should be direct, helpful, and immediately actionable
- Do NOT use markdown in assistantMessage — plain text only
- Do NOT end responses with a question unless the user explicitly asked for guidance on their brand setup`

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY is not configured.' }, { status: 500 })
  }

  let body: { message: string; userId?: string; clientId?: string; currentStatus?: Record<string, string> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { message, userId, clientId, currentStatus } = body
  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is required.' }, { status: 400 })
  }

  // Supabase is best-effort — never crash if it fails
  let supabase: Awaited<ReturnType<typeof createClient>> | null = null
  try {
    supabase = await createClient()
  } catch (e) {
    console.warn('[strategy/chat] Supabase init failed (non-fatal):', (e as Error).message)
  }

  // Save user message (non-blocking)
  if (supabase && (userId || clientId)) {
    supabase.from('strategy_messages').insert({
      role: 'user',
      content: message,
      user_id: userId ?? null,
      client_id: clientId ?? null,
    }).catch((e: Error) => console.warn('[strategy/chat] save user msg failed:', e.message))
  }

  // Load recent conversation history (last 16 messages)
  let history: { role: 'user' | 'assistant'; content: string }[] = []
  if (supabase && userId) {
    try {
      const { data } = await supabase
        .from('strategy_messages')
        .select('role, content')
        .eq('user_id', userId)
        .in('role', ['user', 'assistant'])
        .order('created_at', { ascending: false })
        .limit(16)
      if (data) {
        history = (data as { role: 'user' | 'assistant'; content: string }[]).reverse().slice(0, -1)
      }
    } catch (e) {
      console.warn('[strategy/chat] load history failed (non-fatal):', (e as Error).message)
    }
  }

  // Load existing memories as context
  let memorySummary = ''
  if (supabase && userId) {
    try {
      const { data: mems } = await supabase
        .from('strategy_memories')
        .select('stage, title, summary')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30)
      if (mems?.length) {
        memorySummary = '\n\nBrand context from memory:\n' +
          mems.map((m: { stage: string; title: string; summary: string }) => `[${m.stage}] ${m.title}: ${m.summary}`).join('\n')
      }
    } catch (e) {
      console.warn('[strategy/chat] load memories failed (non-fatal):', (e as Error).message)
    }
  }

  // Build current status context
  const statusContext = currentStatus
    ? `\nCurrent Super Brain status: ${JSON.stringify(currentStatus)}`
    : ''

  const openai = new OpenAI({ apiKey })

  let parsed: {
    assistantMessage: string
    nextQuestion?: string
    extractedMemories: { stage: string; memoryType: string; title: string; summary: string; data: object }[]
    superBrainStatus: Record<string, string>
  }

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + memorySummary + statusContext },
        ...history,
        { role: 'user', content: message },
      ],
      max_tokens: 1200,
    })

    const raw = completion.choices[0].message.content ?? '{}'
    parsed = JSON.parse(raw)
  } catch (err) {
    console.error('OpenAI chat error:', err)
    return NextResponse.json(
      { error: 'Strategy AI could not respond right now. Please try again.' },
      { status: 502 }
    )
  }

  // Ensure required fields exist
  parsed.assistantMessage ??= 'Got it — I saved that to your Super Brain.'
  parsed.extractedMemories ??= []
  parsed.superBrainStatus ??= {}

  // Save assistant message (non-blocking)
  if (supabase && (userId || clientId)) {
    supabase.from('strategy_messages').insert({
      role: 'assistant',
      content: parsed.assistantMessage,
      user_id: userId ?? null,
      client_id: clientId ?? null,
    }).catch((e: Error) => console.warn('[strategy/chat] save assistant msg failed:', e.message))
  }

  // Save extracted memories (non-blocking)
  if (supabase && parsed.extractedMemories.length && (userId || clientId)) {
    const rows = parsed.extractedMemories.map((mem: { stage: string; memoryType: string; title: string; summary: string; data: object }) => ({
      user_id: userId ?? null,
      client_id: clientId ?? null,
      stage: mem.stage,
      memory_type: mem.memoryType,
      title: mem.title,
      summary: mem.summary,
      data: mem.data ?? {},
    }))
    supabase.from('strategy_memories').insert(rows)
      .catch((e: Error) => console.warn('[strategy/chat] save memories failed:', e.message))
  }

  return NextResponse.json(parsed)
}
