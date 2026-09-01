import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { STATUS_STYLES } from '@/lib/types'

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
      <div className="rounded-3xl border border-[#E6DFEF] bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-[#7A7090]">Your student profile is not set up yet. Contact your tutor.</p>
      </div>
    )
  }

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('student_id', student.id)
    .order('starts_at', { ascending: false })

  const allSessions = sessions ?? []

  const now = new Date().getTime()
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
      homework: s.ai_review.homework,
    }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#241C38]">Welcome, {studentProfile.full_name}</h1>
        <p className="mt-1 text-sm text-[#6C6382]">
          {student.subject} · {student.current_level || 'Level not set'}
        </p>
      </div>

      <section className="rounded-3xl border border-[#E6DFEF] bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-[#241C38]">Upcoming sessions</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-[#9E95AF]">No upcoming sessions.</p>
        ) : (
          <ul className="space-y-2.5">
            {upcoming.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-2xl border border-[#ECE4F5] bg-[#FDFCFA] px-4 py-3.5">
                <div>
                  <p className="font-semibold text-[#241C38]">{s.topic}</p>
                  <p className="text-xs text-[#7A7090]">{new Date(s.starts_at).toLocaleString()}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[s.status]}`}>
                  {s.status.replace('_', ' ')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-3xl border border-[#E6DFEF] bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-[#241C38]">Past sessions &amp; notes</h2>
        {past.length === 0 ? (
          <p className="text-sm text-[#9E95AF]">No past sessions yet.</p>
        ) : (
          <ul className="space-y-3.5">
            {past.map((s) => (
              <li key={s.id} className="rounded-2xl border border-[#ECE4F5] bg-[#FDFCFA] p-4.5">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[#241C38]">{s.topic}</p>
                    <p className="text-xs text-[#7A7090]">{new Date(s.starts_at).toLocaleString()}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[s.status]}`}>
                    {s.status.replace('_', ' ')}
                  </span>
                </div>
                {s.notes && (
                  <div className="mt-3 rounded-xl border border-[#ECE4F5] bg-white p-3.5">
                    <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#7A7090]">Notes</p>
                    <p className="whitespace-pre-wrap text-sm text-[#3E3553]">{s.notes}</p>
                  </div>
                )}
                {s.ai_review && (
                  <div className="mt-3 space-y-2 rounded-xl border border-emerald-200/70 bg-emerald-50/50 p-3.5">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">AI review</p>
                    <p className="text-sm leading-relaxed text-[#2A453B]">{s.ai_review.summary}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {homework.length > 0 && (
        <section className="rounded-3xl border border-[#E6DFEF] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-[#241C38]">Homework</h2>
          <ul className="space-y-3">
            {homework.map((h, i) => (
              <li key={i} className="rounded-2xl border border-[#ECE4F5] bg-[#FDFCFA] p-4">
                <p className="mb-0.5 text-sm font-bold text-[#241C38]">{h.topic}</p>
                <p className="mb-2 text-xs text-[#7A7090]">{new Date(h.date).toLocaleDateString()}</p>
                <ol className="list-decimal space-y-1.5 pl-5 text-sm text-[#3E3553]">
                  {h.homework.map((item: string, j: number) => <li key={j}>{item}</li>)}
                </ol>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}