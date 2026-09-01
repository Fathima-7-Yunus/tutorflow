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
          className="rounded-xl bg-[#7E6BB5] hover:bg-[#6D58A9] px-4 py-2.5 text-xs font-bold text-white transition shadow-xs hover:shadow active:scale-95 disabled:opacity-60 cursor-pointer"
        >
          {loading ? 'Analyzing progress…' : '📈 Generate progress summary'}
        </button>
      )}

      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-medium text-red-600">{error}</p>}

      {summary && (
        <div className="rounded-2xl border border-[#D5C9EB] bg-[#FAF7FD] p-5">
          <h4 className="mb-2 font-bold text-[#2E2054]">Progress summary</h4>
          <p className="text-sm leading-relaxed text-[#3E3553]">{summary}</p>
        </div>
      )}
    </div>
  )
}