import Link from 'next/link'
import Image from 'next/image'
import { getRole } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function Home() {
  const role = await getRole()
  if (role === 'tutor') redirect('/tutor')
  if (role === 'student') redirect('/student')

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#FAF7F2] text-[#241C38] flex flex-col justify-between selection:bg-[#7E6BB5] selection:text-white">
      {/* Top Organic Blob SVG Background */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-64 sm:h-80 z-0">
        <svg
          viewBox="0 0 1440 380"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-cover preserve-3d"
        >
          <path
            d="M-50 -20 C 180 -10, 240 180, 480 140 C 720 100, 780 30, 1020 50 C 1220 70, 1380 -20, 1500 -20 L 1500 -50 L -50 -50 Z"
            fill="#9685C8"
          />
          {/* Subtle decorative doodle curve */}
          <path
            d="M 120 180 C 260 220, 400 130, 560 160 C 700 190, 860 100, 1060 120 C 1220 130, 1380 90, 1480 80"
            stroke="#9685C8"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeOpacity="0.4"
            fill="none"
          />
        </svg>
      </div>

      {/* Bottom Left Organic Blob SVG Background */}
      <div className="pointer-events-none absolute bottom-0 left-0 w-full sm:w-[650px] h-48 sm:h-72 z-0">
        <svg
          viewBox="0 0 650 300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <path
            d="M -50 140 C 80 120, 180 260, 360 220 C 480 190, 540 280, 680 260 L 680 350 L -50 350 Z"
            fill="#9685C8"
          />
          {/* Doodle contour lines */}
          <path
            d="M -30 110 C 110 90, 200 230, 380 190 C 500 160, 570 240, 680 220"
            stroke="#9685C8"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeOpacity="0.35"
            fill="none"
          />
          <path
            d="M -20 80 C 120 60, 220 200, 400 160 C 510 130, 600 210, 680 190"
            stroke="#9685C8"
            strokeWidth="1"
            strokeLinecap="round"
            strokeOpacity="0.25"
            fill="none"
          />
        </svg>
      </div>

      {/* Header Navigation */}
      <header className="relative z-10 mx-auto w-full max-w-7xl px-6 py-6 sm:px-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-6 w-6 rounded-full bg-white shadow-sm flex items-center justify-center">
            <div className="h-2.5 w-2.5 rounded-full bg-[#7E6BB5]" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white sm:text-white drop-shadow-sm">
            TutorFlow
          </span>
        </Link>

        <nav className="flex items-center gap-6 sm:gap-8">
          <Link
            href="#about"
            className="text-sm font-medium text-[#241C38]/80 hover:text-[#241C38] transition hidden sm:inline-block"
          >
            About
          </Link>
          <Link
            href="#contact"
            className="text-sm font-medium text-[#241C38]/80 hover:text-[#241C38] transition hidden sm:inline-block"
          >
            Contact us
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-[#7E6BB5] hover:bg-[#6D58A9] text-white px-5 py-2 text-sm font-medium transition shadow-sm hover:shadow active:scale-95"
          >
            Sign up
          </Link>
        </nav>
      </header>

      {/* Hero Main Content */}
      <main className="relative z-10 mx-auto w-full max-w-7xl px-6 py-4 sm:px-12 flex-1 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full my-auto">
          {/* Left Column: Text & CTA */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-8 max-w-xl">
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight text-[#241C38] leading-[1.15]">
              Online platform <br className="hidden sm:inline" />
              for your education
            </h1>

            <p className="text-base sm:text-lg text-[#5A5270] leading-relaxed">
              TutorFlow empowers tutors and students with seamless session scheduling, structured lesson notes, and interactive AI learning tools in one focused workspace.
            </p>

            <div className="flex flex-wrap items-center gap-6 pt-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl bg-[#7E6BB5] hover:bg-[#6D58A9] text-white px-8 py-3.5 text-base font-bold tracking-wider uppercase transition shadow-md hover:shadow-lg active:scale-95"
              >
                START
              </Link>

              {/* Social Icons matching image */}
              <div className="flex items-center gap-3 text-[#7E6BB5]/80">
                <a
                  href="#facebook"
                  aria-label="Facebook"
                  className="h-8 w-8 rounded-full bg-[#ECE7F7] flex items-center justify-center hover:bg-[#7E6BB5] hover:text-white transition"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a
                  href="#twitter"
                  aria-label="Twitter"
                  className="h-8 w-8 rounded-full bg-[#ECE7F7] flex items-center justify-center hover:bg-[#7E6BB5] hover:text-white transition"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a
                  href="#whatsapp"
                  aria-label="WhatsApp"
                  className="h-8 w-8 rounded-full bg-[#ECE7F7] flex items-center justify-center hover:bg-[#7E6BB5] hover:text-white transition"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.993.541 1.734.779 2.796.78 3.18 0 5.768-2.587 5.768-5.767 0-3.18-2.587-5.766-5.768-5.766zm9.969 5.766c0 5.518-4.482 10-10 10-1.748 0-3.385-.45-4.819-1.238l-7.181 1.88 1.916-6.996C1.127 14.161.68 12.548.68 10.838c0-5.518 4.482-10 10-10 5.518 0 10 4.482 10 10z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Illustration Portal matching image */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end">
            <div className="relative w-[320px] sm:w-[420px] lg:w-[460px] aspect-square flex items-center justify-center">
              {/* Outer decorative contour circle */}
              <div className="absolute inset-0 rounded-full border border-[#9685C8]/30 -rotate-3 scale-105 pointer-events-none" />
              
              {/* Main White Portal Circle */}
              <div className="relative w-full h-full rounded-full bg-white shadow-lg overflow-hidden border-2 border-[#ECE7F7] flex items-center justify-center">
                <Image
                  src="/hero-student.jpg"
                  alt="Student graduate learning with TutorFlow"
                  width={500}
                  height={500}
                  priority
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Floating decorative star / doodle accents */}
              <div className="absolute -top-2 -right-2 text-[#7E6BB5] animate-bounce text-xl">✦</div>
              <div className="absolute bottom-4 -left-3 text-[#7E6BB5] text-lg">✦</div>
            </div>
          </div>
        </div>
      </main>

      {/* Clean, Minimal Footer */}
      <footer className="relative z-10 mx-auto w-full max-w-7xl px-6 py-6 sm:px-12 flex flex-col sm:flex-row items-center justify-between text-xs text-[#887E9C] gap-3">
        <p>© {new Date().getFullYear()} TutorFlow. All rights reserved.</p>
        <div className="flex gap-6">
          <Link href="/login" className="hover:text-[#241C38] transition">Sign in</Link>
          <a href="#about" className="hover:text-[#241C38] transition">About</a>
          <a href="#contact" className="hover:text-[#241C38] transition">Contact</a>
        </div>
      </footer>
    </div>
  )
}