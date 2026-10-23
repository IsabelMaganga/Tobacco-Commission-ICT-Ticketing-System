'use client';
import { CATEGORIES, PRIORITIES, STATUSES, label } from '@/lib/ticket-types';

export interface Filters { search: string; status: string; priority: string; category: string }

export default function TicketFilters({ value, onChange }: { value: Filters; onChange: (f: Filters) => void }) {
  const set = (k: keyof Filters) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    onChange({ ...value, [k]: e.target.value });
  const field = 'rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700';

  const select = (k: 'status' | 'priority' | 'category', all: string, options: string[]) => (
    <select aria-label={all} value={value[k]} onChange={set(k)} className={field}>
      <option value="">{all}</option>
      {options.map((o) => <option key={o} value={o}>{label(o)}</option>)}
    </select>
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <input type="search" placeholder="Search title, number or description" value={value.search} onChange={set('search')} className={field} />
      {select('status', 'All statuses', STATUSES)}
      {select('priority', 'All priorities', PRIORITIES)}
      {select('category', 'All categories', CATEGORIES)}
    </div>
  );
}
