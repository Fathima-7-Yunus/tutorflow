'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AiPlan } from '@/lib/types'

interface Props {
  sessionId: string
  initialPlan: AiPlan | null
  disabled: boolean
}

export default function AiPlanButton({ sessionId, initialPlan, disabled }: Props) {
  const router = useRouter()
  const [plan, setPlan] = useState<AiPlan | null>(initialPlan)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to generate plan')
      } else {
        setPlan(data.plan)
        router.refresh()
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {!plan && (
        <button
          onClick={handleGenerate}
          disabled={disabled || loading}
          className="rounded-xl bg-[#7E6BB5] hover:bg-[#6D58A9] px-4 py-2.5 text-xs font-bold text-white transition shadow-xs hover:shadow active:scale-95 disabled:opacity-60 cursor-pointer"
        >
          {loading ? 'Generating plan…' : '✨ Generate AI session plan'}
        </button>
      )}

      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-medium text-red-600">{error}</p>}

      {plan && (
        <div className="space-y-4 rounded-2xl border border-[#D5C9EB] bg-[#FAF7FD] p-5">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-[#2E2054]">AI session plan</h4>
            {disabled && (
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="rounded-xl bg-[#7E6BB5] hover:bg-[#6D58A9] px-3 py-1.5 text-xs font-semibold text-white transition shadow-xs hover:shadow active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                {loading ? 'Regenerating…' : 'Regenerate'}
              </button>
            )}
          </div>

          <div>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-[#7E6BB5]">Learning objectives</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-[#3E3553]">
              {plan.objectives.map((o, i) => <li key={i}>{o}</li>)}
            </ul>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-[#7E6BB5]">Lesson outline</p>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-[#3E3553]">
              {plan.outline.map((o, i) => <li key={i}>{o}</li>)}
            </ol>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-[#7E6BB5]">Practice questions</p>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-[#3E3553]">
              {plan.practice_questions.map((q, i) => <li key={i}>{q}</li>)}
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}