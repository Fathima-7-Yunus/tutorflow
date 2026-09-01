'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const redirect = searchParams.get('redirect') || ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.user) {
      setError(error?.message || 'Invalid email or password')
      setLoading(false)
      return
    }

    const role = data.user.user_metadata?.role as string | undefined
    if (role === 'tutor') router.push(redirect || '/tutor')
    else if (role === 'student') router.push(redirect || '/student')
    else {
      setError('Account has no role assigned.')
      await supabase.auth.signOut()
    }
    setLoading(false)
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#FAF7F2] text-[#241C38] flex items-center justify-center px-4 py-12">
      {/* Top Wave Blob */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-48 sm:h-64 z-0">
        <svg
          viewBox="0 0 1440 280"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-cover"
        >
          <path
            d="M-50 -20 C 180 -10, 240 140, 480 100 C 720 60, 780 10, 1020 30 C 1220 50, 1380 -20, 1500 -20 L 1500 -50 L -50 -50 Z"
            fill="#9685C8"
          />
        </svg>
      </div>

      {/* Bottom Wave Blob */}
      <div className="pointer-events-none absolute bottom-0 left-0 w-full sm:w-[500px] h-40 sm:h-56 z-0">
        <svg
          viewBox="0 0 500 240"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <path
            d="M -50 110 C 60 90, 140 210, 280 180 C 370 150, 420 220, 530 200 L 530 270 L -50 270 Z"
            fill="#9685C8"
          />
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-2 group">
            <div className="h-6 w-6 rounded-full bg-[#7E6BB5] flex items-center justify-center shadow-sm">
              <div className="h-2 w-2 rounded-full bg-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-[#241C38]">
              TutorFlow
            </span>
          </Link>
          <p className="text-sm text-[#6C6382]">Session platform for online tutors</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-3xl border border-[#E6DFEF] bg-white p-8 shadow-sm"
        >
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#5A5270]">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-[#DCD5E8] bg-[#FDFCFA] px-3.5 py-2.5 text-sm text-[#241C38] placeholder-[#9E95AF] transition focus:border-[#7E6BB5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ECE7F7]"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#5A5270]">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-[#DCD5E8] bg-[#FDFCFA] px-3.5 py-2.5 text-sm text-[#241C38] placeholder-[#9E95AF] transition focus:border-[#7E6BB5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#ECE7F7]"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs font-medium text-red-600" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#7E6BB5] hover:bg-[#6D58A9] px-4 py-3 text-sm font-bold tracking-wide text-white transition shadow-sm hover:shadow active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#887E9C]">
          Test accounts are listed in the README.
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#FAF7F2] text-[#5A5270]">Loading…</div>}>
      <LoginForm />
    </Suspense>
  )
}