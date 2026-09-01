import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SESSION_DURATION_MS } from '@/lib/types'

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
    return NextResponse.json({ error: 'Only tutors can schedule sessions' }, { status: 403 })
  }

  const body = await request.json()
  const { student_id, topic, starts_at } = body

  if (!student_id || !topic || !starts_at) {
    return NextResponse.json({ error: 'Student, topic, and date/time are required' }, { status: 400 })
  }

  const startDate = new Date(starts_at)
  if (isNaN(startDate.getTime())) {
    return NextResponse.json({ error: 'Invalid date/time' }, { status: 400 })
  }

  if (startDate < new Date()) {
    return NextResponse.json({ error: 'Session cannot be in the past' }, { status: 400 })
  }

  if (!topic.trim()) {
    return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
  }

  const endDate = new Date(startDate.getTime() + SESSION_DURATION_MS)

  const { data: clashes, error: clashError } = await supabase
    .from('sessions')
    .select('id, starts_at')
    .eq('tutor_id', user.id)
    .not('status', 'in', '("completed","ai_reviewed")')
    .gt('starts_at', new Date(startDate.getTime() - SESSION_DURATION_MS).toISOString())
    .lt('starts_at', endDate.toISOString())

  if (clashError) {
    return NextResponse.json({ error: 'Failed to check for scheduling conflicts' }, { status: 500 })
  }

  if (clashes && clashes.length > 0) {
    return NextResponse.json({ error: 'You already have a session scheduled during this time' }, { status: 409 })
  }

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert({
      tutor_id: user.id,
      student_id,
      topic: topic.trim(),
      starts_at: startDate.toISOString(),
    })
    .select()
    .single()

  if (sessionError) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }

  return NextResponse.json({ session }, { status: 201 })
}