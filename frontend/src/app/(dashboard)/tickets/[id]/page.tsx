'use client';
import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { STATUSES, Ticket, TicketStatus, UserLite, formatDate, label } from '@/lib/ticket-types';
import { PriorityBadge, StatusBadge } from '@/components/TicketBadges';

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const isOfficer = user?.role === 'ict_officer' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [officers, setOfficers] = useState<UserLite[]>([]);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [body, setBody] = useState('');
  const [internal, setInternal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/tickets/${id}`);
      setTicket(data.data ?? data);
    } catch {
      setError('This ticket could not be loaded. It may not exist, or you may not have access to it.');
    }
  }, [id]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    if (!isAdmin) return;
    api.get('/users', { params: { role: 'ict_officer' } })
      .then(({ data }) => setOfficers(data.data ?? data))
      .catch(() => setOfficers([]));
  }, [isAdmin]);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setActionError('');
    try { await fn(); await load(); }
    catch { setActionError('That action failed. Check your permissions and try again.'); }
    finally { setBusy(false); }
  };

  const addComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    run(async () => {
      await api.post(`/tickets/${id}/comments`, { body, is_internal: isOfficer && internal });
      setBody('');
      setInternal(false);
    });
  };
  const assign = (assigneeId: number) => run(() => api.patch(`/tickets/${id}/assign`, { assignee_id: assigneeId }));
  const setStatus = (status: TicketStatus) =>
    run(() => (status === 'resolved' ? api.patch(`/tickets/${id}/resolve`) : api.patch(`/tickets/${id}`, { status })));
  const removeComment = (cid: number) => run(() => api.delete(`/tickets/${id}/comments/${cid}`));
  const deleteTicket = async () => {
    if (!window.confirm('Delete this ticket permanently?')) return;

    setDeleting(true);
    setActionError('');
    try {
      await api.delete(`/tickets/${id}`);
      router.push('/tickets');
    } catch {
      setActionError('The ticket could not be deleted. Please try again.');
      setDeleting(false);
    }
  };

  if (error) return <div className="mx-auto max-w-3xl px-4 py-8"><p role="alert" className="rounded-md bg-red-50 p-3 text-red-700">{error}</p><Link href="/tickets" className="mt-3 inline-block text-sm underline">Back to tickets</Link></div>;
  if (!ticket) return <p className="px-4 py-8 text-sm text-gray-500">Loading ticket…</p>;

  const comments = [...(ticket.comments ?? [])].sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
  const canDelete = (c: { user_id: number }) => isAdmin || (isOfficer && c.user_id === user?.id);

  const meta = (k: string, v: React.ReactNode) => (
    <div><dt className="text-xs text-gray-500">{k}</dt><dd className="mt-0.5 text-sm text-gray-900">{v}</dd></div>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <Link href="/tickets" className="text-sm text-gray-500 hover:underline">← All tickets</Link>

      <header>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">{ticket.ticket_number}</p>
            <h1 className="mt-1 text-2xl font-semibold text-gray-900">{ticket.title}</h1>
          </div>
          {isAdmin && (
            <button
              type="button"
              disabled={deleting || busy}
              onClick={deleteTicket}
              className="shrink-0 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Delete ticket'}
            </button>
          )}
        </div>
        <div className="mt-3 flex gap-2"><StatusBadge status={ticket.status} /><PriorityBadge priority={ticket.priority} /></div>
      </header>

      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{ticket.description}</p>
        <dl className="mt-5 grid grid-cols-2 gap-4 border-t pt-4 sm:grid-cols-3">
          {meta('Category', label(ticket.category))}
          {meta('Department', ticket.department ?? '—')}
          {meta('Reporter', ticket.reporter?.name ?? '—')}
          {meta('Assigned to', ticket.assignee?.name ?? 'Unassigned')}
          {meta('Reported', formatDate(ticket.created_at))}
          {meta('Resolved', ticket.resolved_at ? formatDate(ticket.resolved_at) : '—')}
        </dl>
      </section>

      {isOfficer && (
        <section className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">Manage ticket</h2>
          {actionError && <p role="alert" className="mt-2 text-sm text-red-600">{actionError}</p>}
          <div className="mt-3 flex flex-wrap items-end gap-4">
            <div>
              <label htmlFor="status" className="block text-xs text-gray-500">Status</label>
              <select id="status" value={ticket.status} disabled={busy} onChange={(e) => setStatus(e.target.value as TicketStatus)} className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm">
                {STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
              </select>
            </div>
            {user && ticket.assignee_id !== user.id && (
              <button disabled={busy} onClick={() => assign(user.id)} className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">Assign to me</button>
            )}
            {isAdmin && officers.length > 0 && (
              <div>
                <label htmlFor="assignee" className="block text-xs text-gray-500">Reassign</label>
                <select id="assignee" value={ticket.assignee_id ?? ''} disabled={busy} onChange={(e) => e.target.value && assign(Number(e.target.value))} className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm">
                  <option value="">Choose officer</option>
                  {officers.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
            )}
            {isAdmin && officers.length === 0 && (
              <p className="text-sm text-gray-500">No ICT officers are available for assignment.</p>
            )}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold text-gray-900">Comments ({comments.length})</h2>
        <ul className="mt-4 space-y-3">
          {comments.length === 0 && <li className="text-sm text-gray-500">No comments yet.</li>}
          {comments.map((c) => (
            <li key={c.id} className={`rounded-lg border p-4 ${c.is_internal ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  <span className="font-medium text-gray-800">{c.user?.name ?? 'User'}</span> · {formatDate(c.created_at)}
                  {c.is_internal && <span className="ml-2 rounded bg-amber-200 px-1.5 py-0.5 font-medium text-amber-900">Internal note</span>}
                </span>
                {canDelete(c) && <button disabled={busy} onClick={() => removeComment(c.id)} className="text-red-600 hover:underline">Delete</button>}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">{c.body}</p>
            </li>
          ))}
        </ul>

        {ticket.status !== 'closed' && (
          <form onSubmit={addComment} className="mt-5 space-y-3">
            <label htmlFor="comment" className="sr-only">Add a comment</label>
            <textarea id="comment" rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder={internal ? 'Write an internal note (staff cannot see this)' : 'Write a reply'} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700" />
            <div className="flex items-center justify-between">
              {isOfficer ? (
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} /> Internal note
                </label>
              ) : <span />}
              <button type="submit" disabled={busy || !body.trim()} className="rounded-md bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-60">Post comment</button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
