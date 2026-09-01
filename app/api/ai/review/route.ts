import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { callAi, buildReviewPrompt } from '@/lib/ai'
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
    return NextResponse.json({ error: 'Only tutors can generate reviews' }, { status: 403 })
  }

  const body = await request.json()
  const { session_id } = body

  const admin = createAdminClient()

  const { data: session, error: sessionError } = await admin
    .from('sessions')
    .select('*')
    .eq('id', session_id)
    .single()

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }
  if (session.tutor_id !== user.id) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
  }
  if (session.status !== 'completed') {
    return NextResponse.json({ error: 'Session must be completed before reviewing' }, { status: 400 })
  }

  const { data: student, error: studentError } = await admin
    .from('students')
    .select('*')
    .eq('id', session.student_id)
    .single()

  if (studentError || !student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  const { data: pastReviewsData } = await admin
    .from('sessions')
    .select('ai_review')
    .eq('student_id', session.student_id)
    .neq('id', session.id)
    .neq('ai_review', null)
    .order('starts_at', { ascending: true })

  const pastReviews = (pastReviewsData ?? [])
    .map((s) => {
      const r = s.ai_review as AiReview | null
      return r?.summary ?? null
    })
    .filter(Boolean) as string[]

  const prompts = buildReviewPrompt(
    {
      name: student.name,
      subject: student.subject,
      current_level: student.current_level,
      learning_goals: student.learning_goals,
      weak_areas: student.weak_areas,
    },
    session.topic,
    session.notes || '',
    pastReviews,
    session.ai_plan as { objectives: string[] } | null,
  )

  const result = (await callAi({
    systemPrompt: prompts.systemPrompt,
    userPrompt: prompts.userPrompt,
    responseFormat: 'json_object',
  })) as Partial<AiReview> | null

  if (!result || !result.summary || !result.homework || !result.next_suggestion) {
    return NextResponse.json(
      { error: 'The AI could not generate a review right now. Please try again in a moment.' },
      { status: 502 },
    )
  }

  const review: AiReview = {
    summary: String(result.summary),
    homework: (Array.isArray(result.homework) ? result.homework : []).slice(0, 3).map(String),
    next_suggestion: String(result.next_suggestion),
  }

  const { error: updateError } = await admin
    .from('sessions')
    .update({ ai_review: review, status: 'ai_reviewed' })
    .eq('id', session.id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to save review' }, { status: 500 })
  }

  return NextResponse.json({ review })
}