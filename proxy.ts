import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

function roleRedirect(role: string | undefined, request: NextRequest) {
  if (role === 'tutor') return NextResponse.redirect(new URL('/tutor', request.url))
  if (role === 'student') return NextResponse.redirect(new URL('/student', request.url))
  return NextResponse.redirect(new URL('/login', request.url))
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  if (!user) {
    if (pathname === '/login') return supabaseResponse
    if (pathname.startsWith('/api/')) return supabaseResponse
    const url = new URL('/login', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Pass user info to pages via internal headers, so pages don't need a second getUser() call.
  const cookies = supabaseResponse.cookies.getAll()
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', user.id)
  requestHeaders.set('x-user-email', user.email ?? '')
  requestHeaders.set('x-user-role', (user.user_metadata?.role as string) ?? '')
  requestHeaders.set('x-user-name', (user.user_metadata?.full_name as string) || user.email || '')
  supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })
  cookies.forEach((c) => supabaseResponse.cookies.set(c.name, c.value))

  const role = user.user_metadata?.role as string | undefined

  if (pathname.startsWith('/tutor')) {
    if (role !== 'tutor') return roleRedirect(role, request)
    return supabaseResponse
  }

  if (pathname.startsWith('/student')) {
    if (role !== 'student') return roleRedirect(role, request)
    return supabaseResponse
  }

  if (pathname === '/login' || pathname === '/') {
    return roleRedirect(role, request)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/auth).*)',
  ],
}