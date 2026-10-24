'use client';

import { useEffect, useState } from 'react';
import { BarChart3, CalendarDays, Clock3, FileKey2, GitBranch, ShieldCheck, UsersRound } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import type { Role, User } from '@/lib/types';

const roles: Role[] = ['requester', 'tier_1', 'tier_2_3', 'manager'];

export default function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [slas, setSlas] = useState<{ priority: string; response_time_mins: number; resolution_time_mins: number; business_hours_only: boolean }[]>([]);
  const [analytics, setAnalytics] = useState<{ first_response_breach_rate: number; resolution_breach_rate: number; mean_time_to_resolution_minutes: number } | null>(null);
  const [sla, setSla] = useState({ priority: 'P1', response_time_mins: 15, resolution_time_mins: 120, business_hours_only: false });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadUsers = async () => {
    const response = await api.get<{ data: User[] }>('/users');
    setUsers(response.data.data);
    setLoading(false);
  };

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'manager') {
      Promise.all([
        loadUsers(),
        api.get<{ data: typeof slas }>('/v1/admin/slas').then((response) => setSlas(response.data.data)),
        api.get<{ data: typeof analytics }>('/v1/admin/analytics').then((response) => setAnalytics(response.data.data)),
      ]).catch(() => setMessage('Unable to load administration data.'));
    }
  }, [user]);

  const changeRole = async (target: User, role: Role) => {
    await api.patch(`/users/${target.id}`, { role });
    setUsers((current) => current.map((item) => item.id === target.id ? { ...item, role } : item));
    setMessage(`${target.name}'s role was updated.`);
  };

  const removeUser = async (target: User) => {
    if (!window.confirm(`Delete ${target.name}'s account?`)) return;
    await api.delete(`/users/${target.id}`);
    setUsers((current) => current.filter((item) => item.id !== target.id));
  };

  const saveSla = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await api.post<{ data: typeof sla }>('/v1/admin/slas', sla);
    setSlas((current) => [...current.filter((item) => item.priority !== sla.priority), response.data.data]);
    setMessage(`${sla.priority} SLA policy saved.`);
  };

  if (user && user.role !== 'admin' && user.role !== 'manager') {
    return <section className="py-16 text-center"><h1 className="text-xl font-semibold">Access denied</h1></section>;
  }

  return (
    <section className="space-y-8">
      <div className="rounded-2xl bg-[#0b5d43] px-6 py-7 text-white shadow-xl shadow-[#0b5d43]/10 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#d9b85a]">Administrator workspace</p><h1 className="mt-2 text-3xl font-bold tracking-tight">System command centre</h1><p className="mt-2 max-w-xl text-sm text-white/70">Configure the service engine, govern access, and keep support performance visible.</p></div>
          <ShieldMark />
        </div>
      </div>
      {message && <p className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[
        [Clock3, 'SLA policies', 'Response targets'], [CalendarDays, 'Business calendar', 'Hours and holidays'], [GitBranch, 'Routing rules', 'Automated assignment'], [UsersRound, 'Access control', 'People and teams'],
      ].map(([Icon, title, copy]) => <div key={title as string} className="flex items-center gap-3 rounded-xl border border-[#dfe8df] bg-white px-4 py-4 shadow-sm"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#fbf5df] text-[#a47b18]"><Icon size={19} /></span><span><strong className="block text-sm text-[#16392b]">{title as string}</strong><small className="text-xs text-gray-500">{copy as string}</small></span></div>)}</div>
      {analytics && <div><SectionLabel icon={<BarChartIcon />} label="Performance snapshot" /><div className="grid gap-4 sm:grid-cols-3">
        {[
          ['Response breach', `${analytics.first_response_breach_rate}%`],
          ['Resolution breach', `${analytics.resolution_breach_rate}%`],
          ['Mean resolution', `${analytics.mean_time_to_resolution_minutes} min`],
        ].map(([label, value]) => <div key={label} className="rounded-xl border border-[#dfe8df] bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">{label}</p><p className="mt-2 text-2xl font-bold text-[#0b5d43]">{value}</p></div>)}</div></div>}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        <form onSubmit={saveSla} className="space-y-4 rounded-xl border border-[#dfe8df] bg-white p-6 shadow-sm">
          <div><h2 className="text-lg font-semibold text-gray-950">SLA matrix</h2><p className="text-sm text-gray-500">Set response and resolution targets.</p></div>
          <select value={sla.priority} onChange={(event) => setSla({ ...sla, priority: event.target.value })} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-[#16392b]">
            {['P1', 'P2', 'P3', 'P4'].map((priority) => <option key={priority} className="bg-white text-[#16392b]">{priority}</option>)}
          </select>
          <input type="number" min="1" value={sla.response_time_mins} onChange={(event) => setSla({ ...sla, response_time_mins: Number(event.target.value) })} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-[#16392b]" aria-label="Response time in minutes" />
          <input type="number" min="1" value={sla.resolution_time_mins} onChange={(event) => setSla({ ...sla, resolution_time_mins: Number(event.target.value) })} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-[#16392b]" aria-label="Resolution time in minutes" />
          <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={sla.business_hours_only} onChange={(event) => setSla({ ...sla, business_hours_only: event.target.checked })} /> Business hours only</label>
          <button className="w-full rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">Save SLA policy</button>
        </form>
        <div className="rounded-xl border border-[#dfe8df] bg-white p-6 shadow-sm"><SectionLabel icon={<FileKey2 />} label="Configured policies" /><div className="mt-4 divide-y divide-gray-200">{slas.map((policy) => <div key={policy.priority} className="flex items-center justify-between py-3 text-sm"><span className="font-semibold text-[#0b5d43]">{policy.priority}</span><span className="text-gray-600">{policy.response_time_mins}m response · {policy.resolution_time_mins}m resolution</span></div>)}</div></div>
      </div>
      <div><SectionLabel icon={<UsersRound />} label="People and role assignments" /><div className="overflow-hidden rounded-xl border border-[#dfe8df] bg-white shadow-sm">
        {loading ? <p className="p-6 text-gray-500">Loading users...</p> : (
          <div className="divide-y divide-gray-200">
            {users.map((target) => (
              <div key={target.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div>
                  <p className="font-semibold text-gray-950">{target.name}</p>
                  <p className="text-sm text-gray-500">{target.email}{target.department ? ` · ${target.department}` : ''}</p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={roles.includes(target.role) ? target.role : 'requester'}
                    onChange={(event) => changeRole(target, event.target.value as Role)}
                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-[#16392b]"
                    aria-label={`Role for ${target.name}`}
                  >
                    {roles.map((role) => <option key={role} value={role}>{role.replace('_', ' ')}</option>)}
                  </select>
                  <button onClick={() => removeUser(target)} disabled={target.id === user?.id} className="rounded-md px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div></div>
    </section>
  );
}

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#0b5d43]"><span className="text-[#a47b18]">{icon}</span>{label}</div>;
}

function ShieldMark() {
  return <div className="hidden h-16 w-16 items-center justify-center rounded-2xl border border-[#d9b85a]/40 bg-[#d9b85a]/10 text-[#d9b85a] sm:flex"><ShieldCheck size={31} /></div>;
}

function BarChartIcon() {
  return <BarChart3 size={17} />;
}
