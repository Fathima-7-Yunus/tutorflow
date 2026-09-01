import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role as string | undefined

  if (pathname.startsWith('/tutor') && role !== 'tutor') {
    if (role === 'student') {
      return NextResponse.redirect(new URL('/student', request.url))
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname.startsWith('/student') && role !== 'student') {
    if (role === 'tutor') {
      return NextResponse.redirect(new URL('/tutor', request.url))
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname === '/login' && role) {
    if (role === 'tutor') {
      return NextResponse.redirect(new URL('/tutor', request.url))
    }
    if (role === 'student') {
      return NextResponse.redirect(new URL('/student', request.url))
    }
  }

  if (pathname === '/') {
    if (role === 'tutor') {
      return NextResponse.redirect(new URL('/tutor', request.url))
    }
    if (role === 'student') {
      return NextResponse.redirect(new URL('/student', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/auth).*)',
  ],
}