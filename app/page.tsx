import { redirect } from 'next/navigation'
import { getRole } from '@/lib/auth'

export default async function Home() {
  const role = await getRole()
  if (role === 'tutor') redirect('/tutor')
  if (role === 'student') redirect('/student')
  redirect('/login')
}