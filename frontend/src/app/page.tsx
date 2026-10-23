'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getStoredToken } from '@/lib/auth';

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
    if (getStoredToken()) {
      router.replace('/dashboard');
    } else {
      setChecking(false);
    }
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  const features = [
    {
      title: 'Report Faults',
      description:
        'Log ICT faults from anywhere in the Commission — hardware, software, network, email, or access.',
      icon: '📝',
    },
    {
      title: 'Track Progress',
      description:
        'Follow every ticket from open to resolved. Live status, priority, and assignment updates.',
      icon: '📊',
    },
    {
      title: 'Fast Resolution',
      description:
        'ICT officers pick up tickets instantly with full context — reducing downtime across departments.',
      icon: '⚡',
    },
    {
      title: 'Audit Trail',
      description:
        'Every comment, assignment, and status change is logged for compliance and accountability.',
      icon: '🔒',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* ============================ HERO ============================ */}
      <section className="relative min-h-screen flex flex-col">
        <Image
          src="/images/background1.png"
          alt=""
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
        {/* Green tint overlay — pure green */}
        <div className="absolute inset-0 bg-green-950/30 mix-blend-multiply" />

        {/* Header */}
        <header className="relative z-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center overflow-hidden">
                <Image
                  src="/images/logo.png"
                  alt="Tobacco Commission"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <div className="leading-tight">
                <p className="text-white font-bold text-lg">TCITS</p>
                <p className="text-xs text-white/70">
                  Tobacco Commission · IT Ticketing System
                </p>
              </div>
            </Link>

            <Link
              href="/login"
              className="px-5 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-500 rounded-md shadow-lg shadow-green-900/40 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </header>

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex items-center">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
            <div className="max-w-3xl">
              <span className="inline-flex items-center rounded-full bg-green-500/20 text-green-100 text-xs font-medium px-3 py-1 border border-green-400/30 backdrop-blur">
                Official ICT Ticketing System
              </span>

              <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
                The Tobacco Commission IT Ticketing System
              </h1>

              <p className="mt-6 text-lg text-white/80 max-w-2xl">
                Report. Track. Resolve — ICT faults across the Commission. One
                platform to keep every department productive and every fault
                accountable.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Link
                  href="/login"
                  className="px-6 py-3 text-sm font-medium text-white bg-green-600 hover:bg-green-500 rounded-md shadow-lg shadow-green-900/40"
                >
                  Sign in to your account
                </Link>
                <a
                  href="#features"
                  className="px-6 py-3 text-sm font-medium text-white border border-white/30 hover:bg-white/10 rounded-md backdrop-blur"
                >
                  Learn more
                </a>
              </div>

              <div className="mt-12 inline-block rounded-lg bg-black/40 backdrop-blur border border-white/10 px-6 py-4 text-xs text-white/80">
                <p className="font-semibold text-white mb-1">Try the demo:</p>
                <p>
                  <span className="font-medium">Admin:</span> admin@tc.mw · password
                </p>
                <p>
                  <span className="font-medium">ICT Officer:</span> officer@tc.mw · password
                </p>
                <p>
                  <span className="font-medium">Staff:</span> staff@tc.mw · password
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 h-24 bg-gradient-to-b from-transparent to-white" />
      </section>

      {/* ============================ FEATURES ============================ */}
      <section id="features" className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Everything you need to manage ICT faults
            </h2>
            <p className="mt-3 text-gray-600">
              From reporting to resolution — one system for all Commission staff.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md hover:border-green-300 transition-all"
              >
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-gray-900">{f.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ CTA ============================ */}
      <section className="bg-green-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center overflow-hidden mb-6">
            <Image
              src="/images/logo.png"
              alt="Tobacco Commission"
              width={48}
              height={48}
              className="object-contain"
            />
          </div>
          <h2 className="text-3xl font-bold text-white">
            Ready to report a fault?
          </h2>
          <p className="mt-3 text-green-100">
            Sign in with your Commission email to get started.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-block px-6 py-3 text-sm font-medium text-green-800 bg-white hover:bg-green-50 rounded-md shadow-md"
          >
            Sign in now
          </Link>
        </div>
      </section>

      {/* ============================ FOOTER ============================ */}
      <footer className="bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
              <Image
                src="/images/logo.png"
                alt="Tobacco Commission"
                width={28}
                height={28}
                className="object-contain"
              />
            </div>
            <div>
              <p className="text-white font-medium">The Tobacco Commission</p>
              <p className="text-xs">IT Ticketing System (TCITS)</p>
            </div>
          </div>
          <p className="text-xs">
            © {currentYear ?? 2026} The Tobacco Commission. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}