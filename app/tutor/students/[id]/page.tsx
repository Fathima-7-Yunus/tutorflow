import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import type { Session } from '@/lib/types'
import ProgressSummaryButton from '@/components/progress-summary-button'
import ScheduleSessionForm from '@/components/schedule-session-form'

export const dynamic = 'force-dynamic'

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const tutor = await requireRole('tutor')
  const supabase = await createClient()

  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .single()

  if (studentError || !student || student.tutor_id !== tutor.id) {
    notFound()
  }

  const sessionsResult = await supabase
    .from('sessions')
    .select('*')
    .eq('student_id', id)
    .order('starts_at', { ascending: false })

  const sessions = (sessionsResult.data ?? []) as Session[]

  const statusStyles: Record<string, string> = {
    scheduled: 'bg-amber-100 text-amber-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-slate-100 text-slate-600',
    ai_reviewed: 'bg-emerald-100 text-emerald-700',
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/tutor" className="hover:text-indigo-600">Dashboard</Link>
        <span>·</span>
        <span className="text-slate-800">{student.name}</span>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{student.name}</h1>
          </div>
          <ScheduleSessionForm students={[{ ...student, id }]} defaultStudentId={id} />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Subject</p>
            <p className="mt-1 text-sm">{student.subject || 'Not set'}</p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Current level</p>
            <p className="mt-1 text-sm">{student.current_level || 'Not set'}</p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Learning goals</p>
            <p className="mt-1 text-sm">{student.learning_goals || 'Not set'}</p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Weak areas</p>
            <p className="mt-1 text-sm">{student.weak_areas || 'Not set'}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <ProgressSummaryButton studentId={id} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Sessions ({sessions.length})</h2>
        {sessions.length === 0 ? (
          <p className="text-sm text-slate-400">No sessions yet.</p>
        ) : (
          <ul className="space-y-2">
            {sessions.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/tutor/sessions/${s.id}`}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3 transition hover:border-indigo-200 hover:bg-indigo-50"
                >
                  <div>
                    <p className="font-medium">{s.topic}</p>
                    <p className="text-xs text-slate-500">{new Date(s.starts_at).toLocaleString()}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[s.status]}`}>
                    {s.status.replace('_', ' ')}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}