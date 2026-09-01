'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Student } from '@/lib/types'

interface Props {
  students: Student[]
  defaultStudentId?: string
  onScheduled?: () => void
}

export default function ScheduleSessionForm({ students, defaultStudentId, onScheduled }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    student_id: defaultStudentId || '',
    topic: '',
    starts_at: '',
  })
  const [minDateTime, setMinDateTime] = useState('')

  function openModal() {
    const d = new Date(Date.now() + 5 * 60 * 1000)
    d.setSeconds(0, 0)
    const offset = d.getTimezoneOffset()
    setMinDateTime(new Date(d.getTime() - offset * 60000).toISOString().slice(0, 16))
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.student_id || !form.topic.trim() || !form.starts_at) {
      setError('Student, topic, and date/time are required')
      return
    }

    const date = new Date(form.starts_at)
    if (isNaN(date.getTime())) {
      setError('Please enter a valid date and time')
      return
    }

    setLoading(true)
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: form.student_id,
        topic: form.topic.trim(),
        starts_at: date.toISOString(),
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Failed to schedule session')
      setLoading(false)
      return
    }

    setOpen(false)
    setForm({ student_id: defaultStudentId || '', topic: '', starts_at: '' })
    router.refresh()
    setLoading(false)
    onScheduled?.()
  }

  return (
    <>
      <button
        onClick={openModal}
        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700"
      >
        + Schedule session
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Schedule a session</h3>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Student</label>
                <select
                  value={form.student_id}
                  onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="">Select a student…</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Topic</label>
                <input
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="e.g. Quadratic equations"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Date &amp; time (60 min session)</label>
                <input
                  type="datetime-local"
                  min={minDateTime}
                  value={form.starts_at}
                  onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={loading} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60">
                  {loading ? 'Scheduling…' : 'Schedule session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}