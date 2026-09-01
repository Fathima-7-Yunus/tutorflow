import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import LogoutButton from '@/components/logout-button'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  await requireRole('student')

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF7F2] text-[#241C38]">
      <header className="border-b border-[#ECE4F5] bg-white/90 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 sm:px-6 py-3.5">
          <Link href="/student" className="flex items-center gap-2 group">
            <div className="h-6 w-6 rounded-full bg-[#7E6BB5] flex items-center justify-center shadow-xs">
              <div className="h-2 w-2 rounded-full bg-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-[#241C38]">
              TutorFlow
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/student"
              className="font-medium text-[#5A5270] hover:text-[#241C38] transition"
            >
              My sessions
            </Link>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 sm:px-6 py-8">{children}</main>
    </div>
  )
}