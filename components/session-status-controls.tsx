'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  sessionId: string
  status: string
  startsAt: string
}

export default function SessionStatusControls({ sessionId, status, startsAt }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function transition(to: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: to }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to update session')
      } else {
        router.refresh()
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'scheduled') {
    return (
      <div className="space-y-2.5">
        {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-medium text-red-600">{error}</p>}
        <button
          onClick={() => transition('in_progress')}
          disabled={loading}
          className="rounded-xl bg-[#7E6BB5] hover:bg-[#6D58A9] px-4 py-2.5 text-xs font-bold text-white transition shadow-xs hover:shadow active:scale-95 disabled:opacity-60 cursor-pointer"
        >
          {loading ? 'Starting…' : '▶ Start session'}
        </button>
        <p className="text-xs text-[#7A7090]">
          Starts {new Date(startsAt).toLocaleString()}. Can begin up to 15 minutes early.
        </p>
      </div>
    )
  }

  if (status === 'in_progress') {
    return (
      <div className="space-y-2.5">
        {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-medium text-red-600">{error}</p>}
        <button
          onClick={() => transition('completed')}
          disabled={loading}
          className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white transition shadow-xs hover:shadow active:scale-95 disabled:opacity-60 cursor-pointer"
        >
          {loading ? 'Completing…' : '✓ Complete session'}
        </button>
      </div>
    )
  }

  return null
}