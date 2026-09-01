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
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-700 disabled:opacity-60"
        >
          {loading ? 'Running AI review…' : '🔍 Run AI session review'}
        </button>
      )}

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {review && (
        <div className="space-y-4 rounded-xl border border-teal-200 bg-teal-50/50 p-5">
          <h4 className="font-semibold text-teal-900">AI session review</h4>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-teal-600">Summary</p>
            <p className="text-sm leading-relaxed text-slate-700">{review.summary}</p>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-teal-600">Homework</p>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
              {review.homework.map((h, i) => <li key={i}>{h}</li>)}
            </ol>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-teal-600">Next time</p>
            <p className="text-sm text-slate-700">{review.next_suggestion}</p>
          </div>
        </div>
      )}
    </div>
  )
}