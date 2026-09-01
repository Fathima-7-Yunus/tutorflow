import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile, UserRole } from '@/lib/types'

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user ?? null
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const user = await getCurrentUser()
  if (!user) return null
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  return (data as Profile) ?? null
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