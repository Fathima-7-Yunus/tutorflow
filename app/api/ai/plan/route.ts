import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { callAi, buildPlanPrompt } from '@/lib/ai'
import type { AiPlan } from '@/lib/types'

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
    return NextResponse.json({ error: 'Only tutors can generate plans' }, { status: 403 })
  }

  const body = await request.json()
  const { session_id } = body

  const { data: session, error: sessionError } = await supabase
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
  if (session.status === 'completed' || session.status === 'ai_reviewed') {
    return NextResponse.json({ error: 'Session has already started or completed' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: student, error: studentError } = await admin
    .from('students')
    .select('*')
    .eq('id', session.student_id)
    .single()

  if (studentError || !student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  const { data: pastSessions } = await admin
    .from('sessions')
    .select('topic, ai_review')
    .eq('student_id', session.student_id)
    .neq('id', session.id)
    .neq('ai_review', null)
    .order('starts_at', { ascending: true })

  const pastSessionsSafe = (pastSessions ?? []).map((s: { topic: string; ai_review: unknown }) => ({
    topic: s.topic,
    ai_review: typeof s.ai_review === 'object' && s.ai_review ? JSON.stringify(s.ai_review) : null,
  }))

  const prompts = buildPlanPrompt(
    {
      name: student.name,
      subject: student.subject,
      current_level: student.current_level,
      learning_goals: student.learning_goals,
      weak_areas: student.weak_areas,
    },
    session.topic,
    pastSessionsSafe,
  )

  const result = await callAi(prompts.systemPrompt, prompts.userPrompt)

  if (!result || !Array.isArray(result.objectives) || !Array.isArray(result.outline) || !Array.isArray(result.practice_questions)) {
    return NextResponse.json(
      { error: 'The AI could not generate a plan right now. Please try again in a moment.' },
      { status: 502 },
    )
  }

  const plan: AiPlan = {
    objectives: result.objectives.slice(0, 3).map(String),
    outline: result.outline.slice(0, 4).map(String),
    practice_questions: result.practice_questions.slice(0, 3).map(String),
  }

  const { error: updateError } = await admin
    .from('sessions')
    .update({ ai_plan: plan })
    .eq('id', session.id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to save plan' }, { status: 500 })
  }

  return NextResponse.json({ plan })
}