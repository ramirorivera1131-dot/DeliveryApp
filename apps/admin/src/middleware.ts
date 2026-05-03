import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PUBLIC_PATHS = ['/login', '/api/auth']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))

  const response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll:  () => request.cookies.getAll(),
        setAll: (toSet: { name: string; value: string; options: object }[]) => {
          toSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
          })
        },
      },
    },
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Not logged in → redirect to login
  if (!session) {
    if (isPublic) return response
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // Logged in but trying to access public path → redirect to dashboard
  if (isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Verify the user exists in admin_users and is active
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id, role, is_active, locked_until')
    .eq('user_id', session.user.id)
    .single()

  if (!adminUser || !adminUser.is_active) {
    await supabase.auth.signOut()
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('error', 'unauthorized')
    return NextResponse.redirect(url)
  }

  // Check account lockout
  if (adminUser.locked_until && new Date(adminUser.locked_until) > new Date()) {
    await supabase.auth.signOut()
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('error', 'locked')
    return NextResponse.redirect(url)
  }

  // Inject admin role into request headers for server components
  response.headers.set('x-admin-id',   adminUser.id)
  response.headers.set('x-admin-role', adminUser.role)

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|images|.*\\.svg).*)'],
}
