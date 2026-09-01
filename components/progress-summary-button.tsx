'use client'

import { useState } from 'react'

interface Props {
  studentId: string
}

export default function ProgressSummaryButton({ studentId }: Props) {
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleProgress() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to generate progress summary')
      } else {
        setSummary(data.summary)
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {!summary && (
        <button
          onClick={handleProgress}
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? 'Analyzing progress…' : '📈 Generate progress summary'}
        </button>
      )}

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {summary && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-5">
          <h4 className="mb-2 font-semibold text-indigo-900">Progress summary</h4>
          <p className="text-sm leading-relaxed text-slate-700">{summary}</p>
        </div>
      )}
    </div>
  )
}