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
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#241C38]">Welcome, {tutor.full_name}</h1>
          <p className="mt-1 text-sm text-[#6C6382]">Manage your students and sessions</p>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-[#E6DFEF] bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#241C38]">Students ({students.length})</h2>
            <AddStudentForm />
          </div>
          {students.length === 0 ? (
            <p className="text-sm text-[#9E95AF]">No students yet. Add your first student to get started.</p>
          ) : (
            <ul className="space-y-2.5">
              {students.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/tutor/students/${s.id}`}
                    className="flex items-center justify-between rounded-2xl border border-[#ECE4F5] bg-[#FDFCFA] px-4 py-3.5 transition hover:border-[#7E6BB5]/40 hover:bg-[#FAF7FD] hover:shadow-xs group"
                  >
                    <div>
                      <p className="font-semibold text-[#241C38] group-hover:text-[#6D58A9] transition">{s.name}</p>
                      <p className="text-xs text-[#7A7090]">
                        {s.subject || 'No subject'} · {s.current_level || 'No level'}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-[#7E6BB5] group-hover:translate-x-0.5 transition">View →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-3xl border border-[#E6DFEF] bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#241C38]">Upcoming sessions</h2>
            <ScheduleSessionForm students={students} />
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-[#9E95AF]">No upcoming sessions. Schedule your first session.</p>
          ) : (
            <ul className="space-y-2.5">
              {upcoming.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/tutor/sessions/${s.id}`}
                    className="flex items-center justify-between rounded-2xl border border-[#ECE4F5] bg-[#FDFCFA] px-4 py-3.5 transition hover:border-[#7E6BB5]/40 hover:bg-[#FAF7FD] hover:shadow-xs group"
                  >
                    <div>
                      <p className="font-semibold text-[#241C38] group-hover:text-[#6D58A9] transition">{s.topic}</p>
                      <p className="text-xs text-[#7A7090]">
                        {new Date(s.starts_at).toLocaleString()} · {s.students?.name ?? 'Student'}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[s.status]}`}>
                      {s.status.replace('_', ' ')}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-[#E6DFEF] bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-bold text-[#241C38]">Recent sessions</h2>
        {recentPast.length === 0 ? (
          <p className="text-sm text-[#9E95AF]">No past sessions yet.</p>
        ) : (
          <ul className="space-y-2.5">
            {recentPast.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/tutor/sessions/${s.id}`}
                  className="flex items-center justify-between rounded-2xl border border-[#ECE4F5] bg-[#FDFCFA] px-4 py-3.5 transition hover:border-[#7E6BB5]/40 hover:bg-[#FAF7FD] hover:shadow-xs group"
                >
                  <div>
                    <p className="font-semibold text-[#241C38] group-hover:text-[#6D58A9] transition">{s.topic}</p>
                    <p className="text-xs text-[#7A7090]">
                      {new Date(s.starts_at).toLocaleString()} · {s.students?.name ?? 'Student'}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[s.status]}`}>
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