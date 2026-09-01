import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile, UserRole } from '@/lib/types'

interface AuthUser {
  id: string
  email: string | null
  user_metadata: Record<string, unknown>
  created_at: string | null
}

async function getCurrentUser(): Promise<AuthUser | null> {
  const h = await headers()
  const userId = h.get('x-user-id')
  if (userId) {
    return {
      id: userId,
      email: h.get('x-user-email'),
      user_metadata: {
        role: h.get('x-user-role'),
        full_name: h.get('x-user-name'),
      },
      created_at: '',
    }
  }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user as AuthUser | null
}

export async function getProfile(): Promise<Profile | null> {
  const user = await getCurrentUser()
  if (!user) return null
  return {
    id: user.id,
    email: user.email ?? '',
    full_name: (user.user_metadata?.full_name as string) ?? user.email ?? '',
    role: (user.user_metadata?.role as UserRole) ?? 'student',
    created_at: user.created_at ?? '',
  }
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}

export async function requireRole(role: UserRole): Promise<Profile> {
  const profile = await getProfile()
  if (!profile) redirect('/login')
  if (profile.role !== role) {
    redirect(profile.role === 'student' ? '/student' : '/tutor')
  }
  return profile
}

export async function getRole(): Promise<UserRole | null> {
  const profile = await getProfile()
  return profile?.role ?? null
}