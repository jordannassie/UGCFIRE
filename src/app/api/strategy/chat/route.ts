import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

const SYSTEM_PROMPT = `You are Strategy AI for UGCFire.

UGCFire is a strategy-first content company. We don't just make UGC videos — we build the hook, angle, CTA, and strategic purpose behind every piece of content.

Your job:
- Talk naturally with the business owner
- Avoid long forms — extract info from conversation
- Organize everything into the funnel: Brand, Competitors, Content, Strategy, Growth
- Ask one focused follow-up question when needed
- Be concise, practical, and marketing-focused

Every content idea should connect to: Hook, Angle, CTA, Platform, Goal, Why it works.

ALWAYS respond with valid JSON in this exact shape:
{
  "assistantMessage": "your conversational reply here",
  "nextQuestion": "optional follow-up question",
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
- extractedMemories can be empty array [] if the message doesn't contain useful memory
- superBrainStatus should reflect all stages including ones not mentioned (use "new" for untouched stages)
- assistantMessage should be friendly, direct, and 1-3 sentences
- Do NOT use markdown in assistantMessage — plain text only`

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

  const supabase = await createClient()

  // Save user message
  if (supabase && (userId || clientId)) {
    await supabase.from('strategy_messages').insert({
      role: 'user',
      content: message,
      user_id: userId ?? null,
      client_id: clientId ?? null,
    })
  }

  // Load recent conversation history (last 16 messages)
  let history: { role: 'user' | 'assistant'; content: string }[] = []
  if (supabase && userId) {
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
  }

  // Load existing memories as context
  let memorySummary = ''
  if (supabase && userId) {
    const { data: mems } = await supabase
      .from('strategy_memories')
      .select('stage, title, summary')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(40)
    if (mems?.length) {
      memorySummary = '\n\nCurrent Super Brain memories:\n' +
        mems.map(m => `[${m.stage}] ${m.title}: ${m.summary}`).join('\n')
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

  // Save assistant message
  if (supabase && (userId || clientId)) {
    await supabase.from('strategy_messages').insert({
      role: 'assistant',
      content: parsed.assistantMessage,
      user_id: userId ?? null,
      client_id: clientId ?? null,
    })
  }

  // Save extracted memories
  if (supabase && parsed.extractedMemories.length && (userId || clientId)) {
    const rows = parsed.extractedMemories.map(mem => ({
      user_id: userId ?? null,
      client_id: clientId ?? null,
      stage: mem.stage,
      memory_type: mem.memoryType,
      title: mem.title,
      summary: mem.summary,
      data: mem.data ?? {},
    }))
    await supabase.from('strategy_memories').insert(rows)
  }

  return NextResponse.json(parsed)
}
