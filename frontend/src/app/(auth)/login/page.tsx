'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.email?.[0] ||
          'Login failed. Check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-8 overflow-hidden">
      {/* Full-page background image */}
      <Image
        src="/images/background.png"
        alt=""
        fill
        priority
        className="object-cover"
      />

      {/* Dark overlay — keeps text legible */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Deep green tint over the photo */}
      <div className="absolute inset-0 bg-green-900/45 mix-blend-multiply" />

      {/* Card column */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo + branding above card */}
        <div className="flex flex-col items-center mb-6">
          <div className="h-24 w-24 rounded-full bg-white shadow-2xl border border-white/40 flex items-center justify-center overflow-hidden">
            <Image
              src="/images/logo.png"
              alt="Tobacco Commission"
              width={88}
              height={88}
              className="object-contain"
              priority
            />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-white text-center drop-shadow">
            TCTFS
          </h1>
          <p className="text-sm text-white/90 font-medium text-center">
            Tobacco Commission Ticket Fault System
          </p>
          <p className="text-xs text-white/70 text-center mt-0.5">
            ICT Support Portal
          </p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Sign in
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Use your Commission email to continue.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.name@tc.mw"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-green-700"
                />
              </div>

              {/* Password with eye toggle */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-green-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-green-700 focus:outline-none focus-visible:text-green-700"
                    tabIndex={0}
                  >
                    {showPassword ? (
                      // Eye-off icon (password hidden → click to show)
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      // Eye icon (password visible → click to hide)
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Deep-green Sign in button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white bg-green-800 hover:bg-green-700 disabled:bg-green-600/50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <p className="text-center text-xs text-gray-500 mt-6 leading-relaxed">
              Accounts are created by the ICT administrator.
              <br />
              Contact{' '}
              <span className="font-medium text-gray-700">ICT@tc.mw</span> if you
              need access.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-white/70 mt-6">
          © {currentYear ?? 2026} The Tobacco Commission. All rights
          reserved.
        </p>
      </div>
    </div>
  );
}