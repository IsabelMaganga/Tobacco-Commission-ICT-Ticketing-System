'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
        'Log ICT faults from anywhere in the Commission — hardware, software, network, email, or access issues.',
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
      {/* Nav */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-emerald-700">TIMS</span>
            <span className="text-xs text-gray-500 hidden sm:inline">
              Tobacco ICT Support
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1 mb-6">
          Official ICT Support Platform
        </span>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight max-w-3xl mx-auto">
          Report and resolve ICT faults across the Commission
        </h1>
        <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
          TIMS is the Tobacco Commission&apos;s internal ticket management system —
          built to keep every department productive and every fault accountable.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/login"
            className="px-6 py-3 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-sm"
          >
            Sign in to your account
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-md"
          >
            Create an account
          </Link>
        </div>

        {/* Demo creds */}
        <div className="mt-10 inline-block rounded-lg border border-gray-200 bg-gray-50 px-6 py-4 text-left text-xs text-gray-600">
          <p className="font-semibold text-gray-800 mb-1">Try the demo:</p>
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
      </section>

      {/* Features */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">
            Everything you need to manage ICT faults
          </h2>
          <p className="mt-3 text-center text-gray-600 max-w-2xl mx-auto">
            From reporting to resolution — one platform for all Commission staff.
          </p>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
              >
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-gray-900">{f.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Ready to report a fault?
        </h2>
        <p className="mt-3 text-gray-600">
          Sign in with your Commission email to get started.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-block px-6 py-3 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-sm"
        >
          Sign in now
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© {currentYear ?? 2026} The Tobacco Commission. All rights reserved.</p>
          <p>TIMS — Tobacco ICT Management System</p>
        </div>
      </footer>
    </div>
  );
}