import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

const TUTOR = {
  email: 'tutor@tutorflow.com',
  password: 'tutor12345',
  full_name: 'Sarah Teacher',
}

const STUDENT = {
  email: 'student@tutorflow.com',
  password: 'student12345',
  full_name: 'Alex Learner',
  subject: 'Mathematics',
  current_level: 'Grade 10',
  learning_goals: 'Master algebra, improve problem solving speed, prepare for final exams',
  weak_areas: 'Quadratic equations, word problems, fractions and ratios',
}

async function getUserIdByEmail(email: string): Promise<string> {
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (error) throw error
  const user = data.users.find((u) => u.email === email)
  if (!user) {
    throw new Error(`User with email ${email} not found`)
  }
  return user.id
}

async function main() {
  // Create tutor (skip if already exists)
  const { data: tutorData, error: tutorError } = await supabase.auth.admin.createUser({
    email: TUTOR.email,
    password: TUTOR.password,
    email_confirm: true,
    user_metadata: { full_name: TUTOR.full_name, role: 'tutor' },
  })

  const tutorId = tutorError ? await getUserIdByEmail(TUTOR.email) : tutorData.user!.id
  if (tutorError) console.log('Tutor already exists:', TUTOR.email)
  else console.log('Created tutor:', TUTOR.email)

  // Create student (skip if already exists)
  const { data: studentData, error: studentError } = await supabase.auth.admin.createUser({
    email: STUDENT.email,
    password: STUDENT.password,
    email_confirm: true,
    user_metadata: { full_name: STUDENT.full_name, role: 'student' },
  })

  const studentId = studentError ? await getUserIdByEmail(STUDENT.email) : studentData.user!.id
  if (studentError) console.log('Student already exists:', STUDENT.email)
  else console.log('Created student:', STUDENT.email)

  // Upsert student row
  const { data: existingStudent } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', studentId)
    .single()

  if (existingStudent) {
    console.log('Student row already exists:', existingStudent.id)
  } else {
    const { data, error } = await supabase.from('students').insert({
      user_id: studentId,
      tutor_id: tutorId,
      name: STUDENT.full_name,
      subject: STUDENT.subject,
      current_level: STUDENT.current_level,
      learning_goals: STUDENT.learning_goals,
      weak_areas: STUDENT.weak_areas,
    }).select()
    if (error) {
      console.error('Failed to create student row:', error.message)
      process.exit(1)
    }
    console.log('Created student row:', data?.[0]?.id ?? 'unknown')
  }

  // Seed a couple of sessions so the app has data
  const { data: studentRow } = await supabase
    .from('students')
    .select('id')
    .eq('user_id', studentId)
    .single()

  if (studentRow) {
    const now = Date.now()
    const future = new Date(now + 2 * 24 * 60 * 60 * 1000).toISOString()
    const past = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString()

    const { count } = await supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', studentRow.id)

    if (!count || count === 0) {
      const { error: insertError } = await supabase.from('sessions').insert([
        {
          tutor_id: tutorId,
          student_id: studentRow.id,
          topic: 'Quadratic equations',
          starts_at: future,
          status: 'scheduled',
        },
        {
          tutor_id: tutorId,
          student_id: studentRow.id,
          topic: 'Linear equations',
          starts_at: past,
          status: 'ai_reviewed',
          notes: 'Reviewed solving linear equations. Alex handled two-step equations well but struggled with negative coefficients. Completed 5 practice problems together.',
          ai_review: {
            summary: 'Alex made steady progress on linear equations and can now solve two-step problems independently. Negative coefficients still cause hesitation, and algebra word problems need more practice.',
            homework: ['Solve 10 two-step linear equations with negative coefficients', 'Write equations for 5 word problems and solve them', 'Review the distributive property worksheet'],
            next_suggestion: 'Introduce quadratic equations using factoring, building on the distributive property.',
          },
        },
      ])
      if (insertError) {
        console.error('Failed to seed sessions:', insertError.message)
      } else {
        console.log('Seeded 2 sessions for the student')
      }
    } else {
      console.log(`Sessions already exist (${count}), skipping seed`)
    }
  }

  console.log('\nDone! Test accounts:')
  console.log('  Tutor  ->', TUTOR.email, '/', TUTOR.password)
  console.log('  Student ->', STUDENT.email, '/', STUDENT.password)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})