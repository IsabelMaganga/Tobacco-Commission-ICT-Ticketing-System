'use client';

import AuthGuard from '@/components/AuthGuard';
import Navbar from '@/components/Navbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#f4f7f3] md:pl-72">
        <Navbar />
        <main className="mx-auto max-w-[1500px] px-5 py-8 pt-20 sm:px-8 md:py-10 md:pt-10">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}