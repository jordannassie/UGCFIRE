import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

const SYSTEM_PROMPT = `You are Strategy AI for UGCFire.

Use the provided Super Brain memories and conversation history to create a complete, practical UGC content strategy. Every output should be ready for a business owner and video creator to use immediately.

ALWAYS respond with valid JSON in this exact shape — no extra fields, no markdown:

{
  "strategySummary": {
    "mainDirection": "string",
    "thisWeeksFocus": "string",
    "bestOpportunity": "string",
    "whyThisMatters": "string"
  },
  "hooks": [
    {
      "text": "hook text here",
      "type": "problem | curiosity | proof | transformation | direct",
      "useCase": "where/how to use this hook"
    }
  ],
  "captions": [
    {
      "text": "caption text",
      "platform": "Instagram | TikTok | Facebook | YouTube Shorts | LinkedIn",
      "cta": "call to action text"
    }
  ],
  "ctaStrategy": [
    {
      "cta": "CTA text",
      "bestUseCase": "when/where to use it",
      "whyItWorks": "the reason it converts"
    }
  ],
  "contentIdeas": [
    {
      "title": "content idea title",
      "angle": "strategic angle / approach",
      "platform": "platform(s)",
      "goal": "awareness | trust | leads | sales | engagement",
      "whyItWorks": "brief explanation"
    }
  ],
  "ugcVideoBriefs": [
    {
      "title": "brief title",
      "hook": "opening hook",
      "angle": "strategic angle",
      "script": "short script or talking points",
      "shotList": ["shot 1", "shot 2"],
      "cta": "end call to action",
      "platforms": ["Instagram Reels", "TikTok"],
      "goal": "what this video achieves",
      "whyItWorks": "explanation",
      "fireCreatorNotes": "notes for the creator"
    }
  ],
  "fireCreatorTasks": [
    {
      "task": "task description",
      "priority": "High | Medium | Low",
      "status": "Draft",
      "relatedBrief": "optional brief title"
    }
  ],
  "growthPlan": {
    "whereToPost": ["platform + why"],
    "weeklyPostingPlan": ["day: action"],
    "whatToTest": ["experiment description"],
    "whatToMeasure": ["metric"],
    "whatToDoubleDownOn": ["what's working to amplify"],
    "nextSevenDays": ["day N: action"]
  }
}

Rules:
- Generate exactly 10 hooks
- Generate exactly 5 captions
- Generate exactly 6 CTA strategies
- Generate exactly 10 content ideas
- Generate exactly 3 UGC video briefs
- Generate exactly 6 Fire Creator tasks
- Be specific to the brand, not generic
- If memory is sparse, make smart assumptions and note them in the summary
- Plain text only — no markdown in any string values`

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY is not configured.' }, { status: 500 })
  }

  let body: { userId?: string; clientId?: string }
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const { userId, clientId } = body
  const supabase = await createClient()

  // Load all memories
  let memoryContext = 'No Super Brain memories found yet — generate a general strategy.'
  if (supabase && userId) {
    const { data: mems } = await supabase
      .from('strategy_memories')
      .select('stage, memory_type, title, summary, data')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(80)
    if (mems?.length) {
      const grouped: Record<string, string[]> = {}
      for (const m of mems) {
        if (!grouped[m.stage]) grouped[m.stage] = []
        grouped[m.stage].push(`${m.title}: ${m.summary}`)
      }
      memoryContext = Object.entries(grouped)
        .map(([stage, items]) => `${stage.toUpperCase()}:\n${items.join('\n')}`)
        .join('\n\n')
    }
  }

  // Load recent messages for context
  let recentMessages = ''
  if (supabase && userId) {
    const { data: msgs } = await supabase
      .from('strategy_messages')
      .select('role, content')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
    if (msgs?.length) {
      recentMessages = '\n\nRecent conversation:\n' +
        msgs.reverse().map(m => `${m.role}: ${m.content}`).join('\n')
    }
  }

  const openai = new OpenAI({ apiKey })

  let strategy: Record<string, unknown>
  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: `Super Brain Memory:\n${memoryContext}${recentMessages}\n\nPlease generate the complete content strategy now.`,
        },
      ],
      max_tokens: 4000,
    })

    const raw = completion.choices[0].message.content ?? '{}'
    strategy = JSON.parse(raw)
  } catch (err) {
    console.error('OpenAI run error:', err)
    return NextResponse.json(
      { error: 'Strategy AI could not generate right now. Please try again.' },
      { status: 502 }
    )
  }

  // Save to strategy_runs
  if (supabase && (userId || clientId)) {
    await supabase.from('strategy_runs').insert({
      user_id: userId ?? null,
      client_id: clientId ?? null,
      status: 'complete',
      input_snapshot: { memoryContext, recentMessages },
      output: strategy,
    })
  }

  return NextResponse.json(strategy)
}
