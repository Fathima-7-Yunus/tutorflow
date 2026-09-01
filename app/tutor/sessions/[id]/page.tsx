import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { STATUS_STYLES, type Session } from '@/lib/types'
import SessionNotesEditor from '@/components/session-notes-editor'
import SessionStatusControls from '@/components/session-status-controls'
import AiPlanButton from '@/components/ai-plan-button'
import AiReviewButton from '@/components/ai-review-button'

export const dynamic = 'force-dynamic'

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const tutor = await requireRole('tutor')
  const supabase = await createClient()

  const { data: session, error } = await supabase
    .from('sessions')
    .select('*, students(*)')
    .eq('id', id)
    .single()

  if (error || !session || session.tutor_id !== tutor.id) {
    notFound()
  }

  const s = session as Session & { students: { name: string } }
  const status = s.status
  const isEditable = status === 'scheduled' || status === 'in_progress'

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-2 text-xs font-semibold text-[#7A7090]">
        <Link href="/tutor" className="hover:text-[#7E6BB5] transition">Dashboard</Link>
        <span>·</span>
        <Link href={`/tutor/students/${s.student_id}`} className="hover:text-[#7E6BB5] transition">{s.students?.name ?? 'Student'}</Link>
        <span>·</span>
        <span className="text-[#241C38]">{s.topic}</span>
      </div>

      <div className="rounded-3xl border border-[#E6DFEF] bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-[#241C38]">{s.topic}</h1>
            <p className="text-xs text-[#7A7090]">
              {s.students?.name ?? 'Student'} · {new Date(s.starts_at).toLocaleString()}
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[status]}`}>
            {status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {status === 'scheduled' && (
        <div className="rounded-3xl border border-[#E6DFEF] bg-white p-6 shadow-sm">
          <AiPlanButton sessionId={id} initialPlan={s.ai_plan} disabled={false} />
          <div className="mt-4 border-t border-[#ECE4F5] pt-4">
            <SessionStatusControls sessionId={id} status={status} startsAt={s.starts_at} />
          </div>
        </div>
      )}

      {status === 'in_progress' && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-[#E6DFEF] bg-white p-6 shadow-sm">
            <SessionNotesEditor sessionId={id} initialNotes={s.notes || ''} editable={isEditable} />
          </div>
          <div className="rounded-3xl border border-[#E6DFEF] bg-white p-6 shadow-sm">
            <SessionStatusControls sessionId={id} status={status} startsAt={s.starts_at} />
          </div>
        </div>
      )}

      {status === 'completed' && (
        <div className="space-y-4">
          {s.ai_plan && (
            <div className="rounded-3xl border border-[#E6DFEF] bg-white p-6 shadow-sm">
              <AiPlanButton sessionId={id} initialPlan={s.ai_plan} disabled={true} />
            </div>
          )}
          <div className="rounded-3xl border border-[#E6DFEF] bg-white p-6 shadow-sm">
            <SessionNotesEditor sessionId={id} initialNotes={s.notes || ''} editable={false} />
          </div>
          <div className="rounded-3xl border border-[#E6DFEF] bg-white p-6 shadow-sm">
            <AiReviewButton sessionId={id} initialReview={null} disabled={false} />
          </div>
        </div>
      )}

      {status === 'ai_reviewed' && (
        <div className="space-y-4">
          {s.ai_plan && (
            <div className="rounded-3xl border border-[#E6DFEF] bg-white p-6 shadow-sm">
              <AiPlanButton sessionId={id} initialPlan={s.ai_plan} disabled={true} />
            </div>
          )}
          <div className="rounded-3xl border border-[#E6DFEF] bg-white p-6 shadow-sm">
            <SessionNotesEditor sessionId={id} initialNotes={s.notes || ''} editable={false} />
          </div>
          <div className="rounded-3xl border border-[#E6DFEF] bg-white p-6 shadow-sm">
            <AiReviewButton sessionId={id} initialReview={s.ai_review} disabled={true} />
          </div>
        </div>
      )}
    </div>
  )
}