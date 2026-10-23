'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Paginated, Ticket } from '@/lib/ticket-types';
import TicketCard from '@/components/TicketCard';
import TicketFilters, { Filters } from '@/components/TicketFilters';

export default function TicketsPage() {
  const [filters, setFilters] = useState<Filters>({ search: '', status: '', priority: '', category: '' });
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Paginated<Ticket> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Debounce so we don't hit the API on every keystroke
    const t = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const params: Record<string, string | number> = { page };
        (Object.keys(filters) as (keyof Filters)[]).forEach((k) => { if (filters[k]) params[k] = filters[k]; });
        const { data } = await api.get<Paginated<Ticket>>('/tickets', { params });
        setResult(data);
      } catch {
        setError('Could not load tickets. Check that the backend is running and try again.');
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [filters, page]);

  const updateFilters = (f: Filters) => { setPage(1); setFilters(f); };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Tickets</h1>
        <Link href="/tickets/new" className="rounded-md bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900">
          New ticket
        </Link>
      </div>

      <TicketFilters value={filters} onChange={updateFilters} />

      {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {loading && !result && <p className="text-sm text-gray-500">Loading tickets…</p>}

      {result && result.data.length === 0 && !loading && (
        <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center">
          <p className="text-gray-700">No tickets match these filters.</p>
          <Link href="/tickets/new" className="mt-2 inline-block text-sm font-medium text-green-800 underline">Report a fault</Link>
        </div>
      )}

      <div className={`space-y-3 ${loading ? 'opacity-60' : ''}`}>
        {result?.data.map((t) => <TicketCard key={t.id} ticket={t} />)}
      </div>

      {result && result.last_page > 1 && (
        <nav className="flex items-center justify-between text-sm" aria-label="Pagination">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-md border px-3 py-1.5 disabled:opacity-40">Previous</button>
          <span className="text-gray-600">Page {result.current_page} of {result.last_page} · {result.total} tickets</span>
          <button disabled={page >= result.last_page} onClick={() => setPage((p) => p + 1)} className="rounded-md border px-3 py-1.5 disabled:opacity-40">Next</button>
        </nav>
      )}
    </div>
  );
}
