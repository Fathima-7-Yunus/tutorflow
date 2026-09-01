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
        className="rounded-xl bg-[#7E6BB5] hover:bg-[#6D58A9] px-3.5 py-1.5 text-xs font-bold text-white transition shadow-xs hover:shadow active:scale-95 cursor-pointer"
      >
        + Schedule session
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-[#E6DFEF] bg-white p-6 sm:p-8 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#241C38]">Schedule a session</h3>
              <button
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-full bg-[#FAF7F2] text-[#7A7090] hover:bg-[#ECE7F7] hover:text-[#241C38] flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#5A5270]">Student</label>
                <select
                  value={form.student_id}
                  onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                  className="w-full rounded-xl border border-[#DCD5E8] bg-[#FDFCFA] px-3.5 py-2.5 text-sm text-[#241C38] transition focus:border-[#7E6BB5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ECE7F7]"
                >
                  <option value="">Select a student…</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#5A5270]">Topic</label>
                <input
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  className="w-full rounded-xl border border-[#DCD5E8] bg-[#FDFCFA] px-3.5 py-2.5 text-sm text-[#241C38] transition focus:border-[#7E6BB5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ECE7F7]"
                  placeholder="e.g. Quadratic equations"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#5A5270]">Date &amp; time (60 min session)</label>
                <input
                  type="datetime-local"
                  min={minDateTime}
                  value={form.starts_at}
                  onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                  className="w-full rounded-xl border border-[#DCD5E8] bg-[#FDFCFA] px-3.5 py-2.5 text-sm text-[#241C38] transition focus:border-[#7E6BB5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ECE7F7]"
                />
              </div>

              {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-medium text-red-600">{error}</p>}

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-[#DCD5E8] bg-white px-4 py-2 text-xs font-semibold text-[#5A5270] transition hover:bg-[#FAF7F2] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-[#7E6BB5] hover:bg-[#6D58A9] px-4 py-2 text-xs font-bold text-white transition shadow-xs hover:shadow active:scale-95 disabled:opacity-60 cursor-pointer"
                >
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