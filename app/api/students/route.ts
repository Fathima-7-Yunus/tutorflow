import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  if (user.user_metadata?.role !== 'tutor') {
    return NextResponse.json({ error: 'Only tutors can create students' }, { status: 403 })
  }

  const body = await request.json()
  const { name, email, password, subject, current_level, learning_goals, weak_areas } = body

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name, role: 'student' },
  })

  if (createError) {
    if (createError.code === 'user_already_exists' || createError.message?.includes('already been registered')) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: createError.message }, { status: 400 })
  }

  const { error: studentError } = await admin
    .from('students')
    .insert({
      user_id: created.user!.id,
      tutor_id: user.id,
      name,
      subject: subject || '',
      current_level: current_level || '',
      learning_goals: learning_goals || '',
      weak_areas: weak_areas || '',
    })

  if (studentError) {
    console.error('Failed to create student row:', studentError)
    return NextResponse.json({ error: 'Failed to create student profile' }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}