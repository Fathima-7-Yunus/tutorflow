import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import type { Session, AiReview } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function StudentDashboard() {
  const studentProfile = await requireRole('student')
  const supabase = await createClient()

  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('user_id', studentProfile.id)
    .single()

  if (!student) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-slate-500">Your student profile is not set up yet. Contact your tutor.</p>
      </div>
    )
  }

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('student_id', student.id)
    .order('starts_at', { ascending: false })

  const allSessions = (sessions ?? []) as Session[]

  const now = Date.now()
  const upcoming = allSessions
    .filter((s) => new Date(s.starts_at).getTime() >= now && s.status !== 'completed' && s.status !== 'ai_reviewed')
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())

  const past = allSessions
    .filter((s) => new Date(s.starts_at).getTime() < now || s.status === 'completed' || s.status === 'ai_reviewed')

  const homework = past
    .filter((s) => s.ai_review)
    .map((s) => ({
      topic: s.topic,
      date: s.starts_at,
      homework: (s.ai_review as AiReview).homework,
    }))

  const statusStyles: Record<string, string> = {
    scheduled: 'bg-amber-100 text-amber-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-slate-100 text-slate-600',
    ai_reviewed: 'bg-emerald-100 text-emerald-700',
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {studentProfile.full_name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {student.subject} · {student.current_level || 'Level not set'}
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Upcoming sessions</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-400">No upcoming sessions.</p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3">
                <div>
                  <p className="font-medium">{s.topic}</p>
                  <p className="text-xs text-slate-500">{new Date(s.starts_at).toLocaleString()}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[s.status]}`}>
                  {s.status.replace('_', ' ')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Past sessions &amp; notes</h2>
        {past.length === 0 ? (
          <p className="text-sm text-slate-400">No past sessions yet.</p>
        ) : (
          <ul className="space-y-3">
            {past.map((s) => (
              <li key={s.id} className="rounded-lg border border-slate-100 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{s.topic}</p>
                    <p className="text-xs text-slate-500">{new Date(s.starts_at).toLocaleString()}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[s.status]}`}>
                    {s.status.replace('_', ' ')}
                  </span>
                </div>
                {s.notes && (
                  <div className="mt-2 rounded-lg bg-slate-50 p-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</p>
                    <p className="whitespace-pre-wrap text-sm text-slate-700">{s.notes}</p>
                  </div>
                )}
                {s.ai_review && (
                  <div className="mt-2 space-y-2 rounded-lg bg-teal-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-teal-600">AI review</p>
                    <p className="text-sm text-slate-700">{(s.ai_review as AiReview).summary}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {homework.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Homework</h2>
          <ul className="space-y-3">
            {homework.map((h, i) => (
              <li key={i} className="rounded-lg border border-slate-100 p-4">
                <p className="mb-1 text-sm font-medium">{h.topic}</p>
                <p className="mb-1 text-xs text-slate-500">{new Date(h.date).toLocaleDateString()}</p>
                <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
                  {h.homework.map((item, j) => <li key={j}>{item}</li>)}
                </ol>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}