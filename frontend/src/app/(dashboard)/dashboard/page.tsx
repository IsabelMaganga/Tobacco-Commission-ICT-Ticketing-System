'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, AlertTriangle, ArrowRight, CheckCircle2, Clock3, Plus, Ticket as TicketIcon } from 'lucide-react';
import api from '@/lib/api';

type DashboardStats = {
  total: number;
  new: number;
  in_progress: number;
  pending: number;
  resolved: number;
  closed: number;
  critical: number;
  by_priority: Record<string, number>;
};

const emptyStats: DashboardStats = { total: 0, new: 0, in_progress: 0, pending: 0, resolved: 0, closed: 0, critical: 0, by_priority: {} };

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.get<DashboardStats>('/dashboard/stats')
      .then(({ data }) => { if (active) setStats(data); })
      .catch(() => { if (active) setError('Overview data could not be loaded. Check that the backend is running, then try again.'); });
    return () => { active = false; };
  }, []);

  if (error) {
    return <section className="mx-auto max-w-5xl rounded-xl border border-red-200 bg-red-50 p-8 text-center"><AlertTriangle className="mx-auto text-red-600" size={28} /><h1 className="mt-3 text-xl font-semibold text-red-900">Overview unavailable</h1><p className="mt-2 text-sm text-red-700">{error}</p><button onClick={() => window.location.reload()} className="mt-5 rounded-md bg-[#0b5d43] px-4 py-2 text-sm font-semibold text-white">Retry</button></section>;
  }

  const data = stats ?? emptyStats;
  const cards = [
    { label: 'All tickets', value: data.total, icon: TicketIcon, tone: 'text-[#0b5d43] bg-[#e4f3eb]' },
    { label: 'New', value: data.new, icon: Activity, tone: 'text-blue-700 bg-blue-50' },
    { label: 'In progress', value: data.in_progress, icon: Clock3, tone: 'text-amber-700 bg-amber-50' },
    { label: 'Resolved', value: data.resolved, icon: CheckCircle2, tone: 'text-emerald-700 bg-emerald-50' },
  ];

  return <section className="mx-auto max-w-6xl space-y-8">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#a47b18]">Tobacco Commission ICT</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-[#16392b]">Overview</h1><p className="mt-2 text-sm text-gray-600">A clear view of your support workload and service health.</p></div><Link href="/tickets/new" className="inline-flex items-center gap-2 rounded-md bg-[#0b5d43] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#084936]"><Plus size={17} /> New ticket</Link></div>
    {!stats && <div className="rounded-lg border border-[#dfe8df] bg-white px-4 py-3 text-sm text-gray-500">Loading overview data...</div>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, icon: Icon, tone }) => <div key={label} className="rounded-xl border border-[#dfe8df] bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-medium text-gray-600">{label}</p><span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}><Icon size={18} /></span></div><p className="mt-4 text-3xl font-bold text-[#16392b]">{value}</p></div>)}</div>
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-xl border border-[#dfe8df] bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold text-[#16392b]">Ticket status</h2><p className="mt-1 text-sm text-gray-500">Current workload across the support desk.</p></div><Link href="/tickets" className="inline-flex items-center gap-1 text-sm font-semibold text-[#0b5d43]">View desk <ArrowRight size={15} /></Link></div><div className="mt-6 space-y-4">{[['New', data.new, 'bg-blue-500'], ['In progress', data.in_progress, 'bg-amber-500'], ['Pending', data.pending, 'bg-gray-400'], ['Resolved', data.resolved, 'bg-emerald-500']].map(([label, value, color]) => <div key={label as string}><div className="mb-1 flex justify-between text-sm"><span className="text-gray-600">{label as string}</span><strong className="text-[#16392b]">{value as number}</strong></div><div className="h-2 overflow-hidden rounded-full bg-gray-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${data.total ? Math.min(100, ((value as number) / data.total) * 100) : 0}%` }} /></div></div>)}</div></div>
      <div className="rounded-xl border border-[#dfe8df] bg-[#0b5d43] p-6 text-white shadow-sm"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#d9b85a]">Priority watch</p><h2 className="mt-3 text-2xl font-bold">{data.critical} critical {data.critical === 1 ? 'ticket' : 'tickets'}</h2><p className="mt-2 text-sm text-white/70">Critical tickets need immediate attention to protect response targets.</p><Link href="/tickets?priority=critical" className="mt-6 inline-flex items-center gap-2 rounded-md bg-[#d9b85a] px-4 py-2 text-sm font-bold text-[#0b5d43]">Open priority queue <ArrowRight size={15} /></Link></div>
    </div>
  </section>;
}
