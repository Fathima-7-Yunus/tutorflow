'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AiReview } from '@/lib/types'

interface Props {
  sessionId: string
  initialReview: AiReview | null
  disabled: boolean
}

export default function AiReviewButton({ sessionId, initialReview, disabled }: Props) {
  const router = useRouter()
  const [review, setReview] = useState<AiReview | null>(initialReview)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleReview() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to generate review')
      } else {
        setReview(data.review)
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
      {!review && (
        <button
          onClick={handleReview}
          disabled={disabled || loading}
          className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white transition shadow-xs hover:shadow active:scale-95 disabled:opacity-60 cursor-pointer"
        >
          {loading ? 'Running AI review…' : '🔍 Run AI session review'}
        </button>
      )}

      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-medium text-red-600">{error}</p>}

      {review && (
        <div className="space-y-4 rounded-2xl border border-emerald-200/70 bg-emerald-50/50 p-5">
          <h4 className="font-bold text-emerald-950">AI session review</h4>

          <div>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800">Summary</p>
            <p className="text-sm leading-relaxed text-[#2A453B]">{review.summary}</p>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800">Homework</p>
            <ol className="list-decimal space-y-1.5 pl-5 text-sm text-[#2A453B]">
              {review.homework.map((h, i) => <li key={i}>{h}</li>)}
            </ol>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800">Next time</p>
            <p className="text-sm leading-relaxed text-[#2A453B]">{review.next_suggestion}</p>
          </div>
        </div>
      )}
    </div>
  )
}