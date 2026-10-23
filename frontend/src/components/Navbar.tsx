'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const link = (href: string, label: string) => {
    const active = pathname === href || pathname.startsWith(href + '/');
    return (
      <Link
        href={href}
        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          active
            ? 'bg-emerald-100 text-emerald-800'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-lg font-bold text-emerald-700">TIMS</span>
              <span className="text-xs text-gray-500 hidden sm:inline">
                Tobacco ICT Support
              </span>
            </Link>
            <div className="flex items-center gap-1">
              {link('/dashboard', 'Dashboard')}
              {link('/tickets', 'Tickets')}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role.replace('_', ' ')}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-sm rounded-md text-gray-700 hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}