'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AddStudentForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    subject: '',
    current_level: '',
    learning_goals: '',
    weak_areas: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError('Name, email, and password are required')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Please enter a valid email address')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)

    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Failed to create student')
      setLoading(false)
      return
    }

    setOpen(false)
    setForm({ name: '', email: '', password: '', subject: '', current_level: '', learning_goals: '', weak_areas: '' })
    router.refresh()
    setLoading(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl bg-[#7E6BB5] hover:bg-[#6D58A9] px-3.5 py-1.5 text-xs font-bold text-white transition shadow-xs hover:shadow active:scale-95 cursor-pointer"
      >
        + Add student
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl border border-[#E6DFEF] bg-white p-6 sm:p-8 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#241C38]">Add a student</h3>
              <button
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-full bg-[#FAF7F2] text-[#7A7090] hover:bg-[#ECE7F7] hover:text-[#241C38] flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#5A5270]">Name *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-xl border border-[#DCD5E8] bg-[#FDFCFA] px-3.5 py-2 text-sm text-[#241C38] transition focus:border-[#7E6BB5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ECE7F7]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#5A5270]">Email *</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-xl border border-[#DCD5E8] bg-[#FDFCFA] px-3.5 py-2 text-sm text-[#241C38] transition focus:border-[#7E6BB5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ECE7F7]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#5A5270]">Password *</label>
                  <input
                    required
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full rounded-xl border border-[#DCD5E8] bg-[#FDFCFA] px-3.5 py-2 text-sm text-[#241C38] transition focus:border-[#7E6BB5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ECE7F7]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#5A5270]">Subject</label>
                  <input
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full rounded-xl border border-[#DCD5E8] bg-[#FDFCFA] px-3.5 py-2 text-sm text-[#241C38] transition focus:border-[#7E6BB5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ECE7F7]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#5A5270]">Current level</label>
                  <input
                    value={form.current_level}
                    onChange={(e) => setForm({ ...form, current_level: e.target.value })}
                    className="w-full rounded-xl border border-[#DCD5E8] bg-[#FDFCFA] px-3.5 py-2 text-sm text-[#241C38] transition focus:border-[#7E6BB5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ECE7F7]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#5A5270]">Learning goals</label>
                  <textarea
                    rows={2}
                    value={form.learning_goals}
                    onChange={(e) => setForm({ ...form, learning_goals: e.target.value })}
                    className="w-full rounded-xl border border-[#DCD5E8] bg-[#FDFCFA] px-3.5 py-2 text-sm text-[#241C38] transition focus:border-[#7E6BB5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ECE7F7]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#5A5270]">Weak areas</label>
                  <textarea
                    rows={2}
                    value={form.weak_areas}
                    onChange={(e) => setForm({ ...form, weak_areas: e.target.value })}
                    className="w-full rounded-xl border border-[#DCD5E8] bg-[#FDFCFA] px-3.5 py-2 text-sm text-[#241C38] transition focus:border-[#7E6BB5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ECE7F7]"
                  />
                </div>
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
                  {loading ? 'Creating…' : 'Add student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}