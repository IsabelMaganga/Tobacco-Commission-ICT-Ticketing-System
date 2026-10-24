'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart3, CalendarDays, ChevronDown, ChevronRight, ClipboardList, Clock3, FileKey2, Gauge, GitBranch, LogOut, Menu, Plus, ShieldCheck, UsersRound, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

const adminRoles = ['admin'];

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(pathname.startsWith('/admin'));
  const isAdmin = adminRoles.includes(user?.role ?? '');

  const links = [
    { href: '/dashboard', label: 'Overview', icon: Gauge },
    { href: '/tickets', label: 'Ticket desk', icon: ClipboardList },
    ...(isAdmin ? [{ href: '/admin', label: 'Administration', icon: ShieldCheck }] : []),
  ];

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <>
      <button aria-label="Open navigation" onClick={() => setOpen(true)} className="fixed left-4 top-4 z-30 rounded-lg bg-[#0b5d43] p-2 text-[#d9b85a] shadow-lg md:hidden">
        <Menu size={21} />
      </button>
      {open && <button aria-label="Close navigation backdrop" onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-[#062e23]/60 md:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-[#0b5d43] text-white shadow-2xl transition-transform duration-300 md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="border-b border-white/10 px-6 py-6">
          <div className="flex items-start justify-between">
            <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-3">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-[#d9b85a]/70 bg-white px-1.5 py-1 shadow-lg shadow-black/10"><Image src="/images/logo.png" alt="Tobacco Commission" width={60} height={60} className="h-full w-full object-contain" priority /></span>
              <span><strong className="block text-lg tracking-tight">TIMS</strong><small className="text-xs text-white/65">Tobacco ICT Support</small></span>
            </Link>
            <button aria-label="Close navigation" onClick={() => setOpen(false)} className="text-white/60 hover:text-white md:hidden"><X size={20} /></button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#d9b85a]">Workspace</p>
          <nav className="space-y-1">
            {links.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              if (href === '/admin') {
                return <div key={href}>
                  <button onClick={() => setAdminOpen((value) => !value)} className={`group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold transition-colors ${active ? 'bg-white text-[#0b5d43] shadow-sm' : 'text-white/75 hover:bg-white/10 hover:text-white'}`}><Icon size={19} className={active ? 'text-[#0b5d43]' : 'text-[#d9b85a]'} /><span className="flex-1">{label}</span><ChevronDown size={16} className={`transition-transform ${adminOpen ? 'rotate-180' : ''}`} /></button>
                  {adminOpen && <div className="admin-submenu mt-1 max-h-[45vh] space-y-1 overflow-y-auto border-l border-[#d9b85a]/35 pl-4 pr-1">
                    {[
                      ['overview', 'Overview', Gauge], ['sla', 'SLA matrix', Clock3], ['business-hours', 'Business hours', CalendarDays], ['holidays', 'Holiday calendar', CalendarDays], ['routing', 'Automated routing', GitBranch], ['groups', 'Support groups', UsersRound], ['roles', 'Role assignments', ShieldCheck], ['onboard', 'Onboard user', Plus], ['workload', 'Agent workload', UsersRound], ['intervention', 'Ticket intervention', ShieldCheck], ['governance', 'SLA governance', Clock3], ['audit', 'Audit trail', FileKey2],
                    ].map(([section, childLabel, ChildIcon]) => <Link key={section as string} href={`/admin?section=${section}`} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white"><ChildIcon size={14} className="text-[#d9b85a]" />{childLabel as string}</Link>)}
                  </div>}
                </div>;
              }
              return <Link key={href} href={href} onClick={() => setOpen(false)} className={`group flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition-colors ${active ? 'bg-white text-[#0b5d43] shadow-sm' : 'text-white/75 hover:bg-white/10 hover:text-white'}`}><Icon size={19} className={active ? 'text-[#0b5d43]' : 'text-[#d9b85a]'} /><span className="flex-1">{label}</span><ChevronRight size={15} className={`opacity-0 transition-opacity group-hover:opacity-100 ${active ? 'opacity-100' : ''}`} /></Link>;
            })}
          </nav>
        </div>
        <div className="mt-auto space-y-4 p-4">
          <div className="rounded-xl border border-white/10 bg-[#084936] p-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d9b85a] font-bold text-[#0b5d43]">{user?.name?.charAt(0).toUpperCase()}</div><div className="min-w-0"><p className="truncate text-sm font-semibold">{user?.name}</p><p className="truncate text-xs capitalize text-white/60">{user?.role?.replaceAll('_', ' ')}</p></div></div></div>
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white"><LogOut size={18} className="text-[#d9b85a]" /> Sign out</button>
        </div>
      </aside>
    </>
  );
}
