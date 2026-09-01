import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { callAi, buildProgressPrompt } from '@/lib/ai'
import type { AiReview } from '@/lib/types'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'tutor') {
    return NextResponse.json({ error: 'Only tutors can view progress summaries' }, { status: 403 })
  }

  const body = await request.json()
  const { student_id } = body

  if (!student_id) {
    return NextResponse.json({ error: 'student_id is required' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: sessions, error: sessionsError } = await admin
    .from('sessions')
    .select('topic, ai_review')
    .eq('student_id', student_id)
    .neq('ai_review', null)
    .order('starts_at', { ascending: true })

  if (sessionsError) {
    return NextResponse.json({ error: 'Failed to load session data' }, { status: 500 })
  }

  if (!sessions || sessions.length === 0) {
    return NextResponse.json(
      { error: 'No AI reviews found for this student yet' },
      { status: 400 },
    )
  }

  const sessionsWithReviews = sessions.map((s: { topic: string; ai_review: AiReview | null }) => ({
    topic: s.topic,
    ai_review: s.ai_review,
  }))

  const prompts = buildProgressPrompt(sessionsWithReviews)

  const result = await callAi(prompts.systemPrompt, prompts.userPrompt)

  if (!result || !result.summary) {
    return NextResponse.json(
      { error: 'The AI could not generate a progress summary right now. Please try again in a moment.' },
      { status: 502 },
    )
  }

  return NextResponse.json({ summary: result.summary })
}