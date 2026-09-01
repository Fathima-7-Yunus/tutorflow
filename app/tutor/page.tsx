import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { STATUS_STYLES, type Session } from '@/lib/types'
import AddStudentForm from '@/components/add-student-form'
import ScheduleSessionForm from '@/components/schedule-session-form'

export const dynamic = 'force-dynamic'

export default async function TutorDashboard() {
  const tutor = await requireRole('tutor')
  const supabase = await createClient()

  const [studentsResult, sessionsResult] = await Promise.all([
    supabase
      .from('students')
      .select('*')
      .eq('tutor_id', tutor.id)
      .order('name'),
    supabase
      .from('sessions')
      .select('*, students(name)')
      .eq('tutor_id', tutor.id)
      .order('starts_at', { ascending: true }),
  ])

  const students = studentsResult.data ?? []
  const sessions = (sessionsResult.data ?? []) as (Session & { students?: { name: string } })[]

  const now = new Date().getTime()
  const upcoming = sessions.filter((s) => new Date(s.starts_at).getTime() >= now)
  const recentPast = sessions
    .filter((s) => new Date(s.starts_at).getTime() < now)
    .slice(0, 5)


  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {tutor.full_name}</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your students and sessions</p>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Students ({students.length})</h2>
            <AddStudentForm />
          </div>
          {students.length === 0 ? (
            <p className="text-sm text-slate-400">No students yet. Add your first student to get started.</p>
          ) : (
            <ul className="space-y-2">
              {students.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/tutor/students/${s.id}`}
                    className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3 transition hover:border-indigo-200 hover:bg-indigo-50"
                  >
                    <div>
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-slate-500">
                        {s.subject || 'No subject'} · {s.current_level || 'No level'}
                      </p>
                    </div>
                    <span className="text-xs text-indigo-600">View →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Upcoming sessions</h2>
            <ScheduleSessionForm students={students} />
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-slate-400">No upcoming sessions. Schedule your first session.</p>
          ) : (
            <ul className="space-y-2">
              {upcoming.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/tutor/sessions/${s.id}`}
                    className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3 transition hover:border-indigo-200 hover:bg-indigo-50"
                  >
                    <div>
                      <p className="font-medium">{s.topic}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(s.starts_at).toLocaleString()} · {s.students?.name ?? 'Student'}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[s.status]}`}>
                      {s.status.replace('_', ' ')}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Recent sessions</h2>
        {recentPast.length === 0 ? (
          <p className="text-sm text-slate-400">No past sessions yet.</p>
        ) : (
          <ul className="space-y-2">
            {recentPast.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/tutor/sessions/${s.id}`}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3 transition hover:border-indigo-200 hover:bg-indigo-50"
                >
                  <div>
                    <p className="font-medium">{s.topic}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(s.starts_at).toLocaleString()} · {s.students?.name ?? 'Student'}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[s.status]}`}>
                    {s.status.replace('_', ' ')}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}