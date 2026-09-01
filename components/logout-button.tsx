'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-xl border border-[#DCD5E8] bg-white px-3 py-1.5 text-xs font-semibold text-[#5A5270] transition hover:bg-[#ECE7F7] hover:text-[#241C38] active:scale-95 cursor-pointer"
    >
      Sign out
    </button>
  )
}