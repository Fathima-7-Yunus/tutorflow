import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isValidTransition, SESSION_DURATION_MS } from '@/lib/types'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data: existing, error: fetchError } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  if (existing.tutor_id !== user.id) {
    return NextResponse.json({ error: 'Not allowed to edit this session' }, { status: 403 })
  }

  const body = await request.json()

  if (body.status) {
    if (!isValidTransition(existing.status, body.status)) {
      return NextResponse.json(
        { error: `Invalid transition from "${existing.status}" to "${body.status}"` },
        { status: 400 },
      )
    }

    if (existing.status === 'completed' && body.status === 'ai_reviewed') {
      return NextResponse.json(
        { error: 'AI review must be generated through the review endpoint' },
        { status: 400 },
      )
    }

    if (existing.status === 'scheduled' && body.status === 'in_progress') {
      const now = Date.now()
      if (now < new Date(existing.starts_at).getTime() - 15 * 60 * 1000) {
        return NextResponse.json(
          { error: 'Session cannot start more than 15 minutes early' },
          { status: 400 },
        )
      }
    }

    const { error: updateError } = await supabase
      .from('sessions')
      .update({ status: body.status })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  }

  if (typeof body.notes === 'string') {
    if (existing.status === 'completed' || existing.status === 'ai_reviewed') {
      return NextResponse.json({ error: 'Session is already completed and cannot be edited' }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from('sessions')
      .update({ notes: body.notes })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to save notes' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  }

  // ----- editing a scheduled session (reschedule / topic) -----
  if (existing.status !== 'scheduled') {
    return NextResponse.json({ error: 'Only scheduled sessions can be edited' }, { status: 400 })
  }

  const { topic, starts_at } = body
  if (!topic || !starts_at) {
    return NextResponse.json({ error: 'Topic and date/time are required' }, { status: 400 })
  }

  const startDate = new Date(starts_at)
  if (isNaN(startDate.getTime())) {
    return NextResponse.json({ error: 'Invalid date/time' }, { status: 400 })
  }
  if (startDate < new Date()) {
    return NextResponse.json({ error: 'Session cannot be in the past' }, { status: 400 })
  }

  const endDate = new Date(startDate.getTime() + SESSION_DURATION_MS)
  const { data: clashes, error: clashError } = await supabase
    .from('sessions')
    .select('id')
    .eq('tutor_id', user.id)
    .not('id', 'eq', id)
    .not('status', 'in', '("completed","ai_reviewed")')
    .gt('starts_at', new Date(startDate.getTime() - SESSION_DURATION_MS).toISOString())
    .lt('starts_at', endDate.toISOString())

  if (clashError) {
    return NextResponse.json({ error: 'Failed to check for scheduling conflicts' }, { status: 500 })
  }
  if (clashes && clashes.length > 0) {
    return NextResponse.json({ error: 'You already have a session scheduled during this time' }, { status: 409 })
  }

  const { error: updateError } = await supabase
    .from('sessions')
    .update({ topic: topic.trim(), starts_at: startDate.toISOString() })
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}