'use client';

import { useState, useEffect, FormEvent, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

const REMEMBER_KEY = 'tcits_remembered_email';

function Icon({
  children,
  className = 'h-5 w-5',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [capsLock, setCapsLock] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      if (saved) setEmail(saved);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    setCapsLock(!!e.getModifierState && e.getModifierState('CapsLock'));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      try {
        if (remember) localStorage.setItem(REMEMBER_KEY, email);
        else localStorage.removeItem(REMEMBER_KEY);
      } catch {
        /* ignore */
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.email?.[0] ||
          'We could not sign you in. Check your email and password, then try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background image — clearly visible */}
      <Image
        src="/images/background1.png"
        alt=""
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 bg-green-900/25 mix-blend-multiply" />

      {/* Centered login card */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/40 overflow-hidden">
            {/* Logo header */}
            <div className="flex flex-col items-center pt-8 px-8">
              <div className="h-24 w-24 rounded-full bg-white shadow-md ring-1 ring-gray-200 flex items-center justify-center overflow-hidden">
                <Image
                  src="/images/logo.png"
                  alt="Tobacco Commission"
                  width={96}
                  height={96}
                  className="object-contain w-[78%] h-[78%]"
                  priority
                />
              </div>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-widest text-green-800 text-center">
               The Tobacco Commission
              </p>
              <p className="text-[11px] text-gray-500 text-center">
                IT Ticketing System
              </p>
            </div>

            <div className="px-8 pb-8 pt-5">
              <h2 className="text-xl font-bold text-gray-900 text-center">
                Sign in
              </h2>
              <p className="text-sm text-gray-500 text-center mt-1 mb-6">
                Use your Commission email to continue.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <Icon className="h-4 w-4">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="m22 7-10 6L2 7" />
                      </Icon>
                    </span>
                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.name@tc.mw"
                      className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Password
                    </label>
                    <a
                      href="mailto:ICT@tc.mw?subject=Password%20reset%20request"
                      className="text-xs font-medium text-green-700 hover:text-green-800 hover:underline"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <Icon className="h-4 w-4">
                        <rect x="3" y="11" width="18" height="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </Icon>
                    </span>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyUp={handleKey}
                      onKeyDown={handleKey}
                      onBlur={() => setCapsLock(false)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-gray-300 pl-9 pr-10 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                      }
                      aria-pressed={showPassword}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-green-700 focus:outline-none focus-visible:text-green-700"
                    >
                      {showPassword ? (
                        <Icon className="h-4 w-4">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                          <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </Icon>
                      ) : (
                        <Icon className="h-4 w-4">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </Icon>
                      )}
                    </button>
                  </div>
                  {capsLock && (
                    <p className="mt-1.5 text-xs text-amber-700" role="status">
                      Caps Lock is on.
                    </p>
                  )}
                </div>

                {/* Remember me */}
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 accent-green-700"
                  />
                  Remember my email on this device
                </label>

                {/* Error */}
                <div aria-live="assertive">
                  {error && (
                    <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                      {error}
                    </div>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white bg-green-700 hover:bg-green-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2 disabled:bg-green-700/50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading && (
                    <svg
                      className="h-4 w-4 animate-spin motion-reduce:animate-none"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeOpacity="0.3"
                        strokeWidth="4"
                      />
                      <path
                        d="M22 12a10 10 0 0 0-10-10"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-gray-200">
                <p className="text-center text-xs text-gray-500 leading-relaxed">
                  Accounts are created by the ICT administrator.
                  <br />
                  Contact{' '}
                  <a
                    href="mailto:ICT@tc.mw"
                    className="font-medium text-green-700 hover:text-green-800 hover:underline"
                  >
                    ICT@tc.mw
                  </a>{' '}
                  if you need access.
                </p>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-white/80 mt-6 drop-shadow">
            © {currentYear ?? 2026} The Tobacco Commission. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}