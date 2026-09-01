import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import LogoutButton from '@/components/logout-button'

export default async function TutorLayout({ children }: { children: React.ReactNode }) {
  await requireRole('tutor')

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/tutor" className="text-lg font-bold text-indigo-600">
            TutorFlow
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/tutor" className="text-slate-600 hover:text-slate-900">
              Dashboard
            </Link>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  )
}