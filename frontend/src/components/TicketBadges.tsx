import { TicketPriority, TicketStatus, label } from '@/lib/ticket-types';

const statusStyle: Record<TicketStatus, string> = {
  NEW: 'bg-blue-50 text-blue-700 ring-blue-200',
  IN_PROGRESS: 'bg-amber-50 text-amber-800 ring-amber-200',
  PENDING: 'bg-gray-100 text-gray-700 ring-gray-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  CLOSED: 'bg-gray-100 text-gray-600 ring-gray-200',
  open: 'bg-blue-50 text-blue-700 ring-blue-200',
  in_progress: 'bg-amber-50 text-amber-800 ring-amber-200',
  resolved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  closed: 'bg-gray-100 text-gray-600 ring-gray-200',
};

const priorityStyle: Record<TicketPriority, string> = {
  low: 'bg-gray-100 text-gray-600 ring-gray-200',
  medium: 'bg-sky-50 text-sky-700 ring-sky-200',
  high: 'bg-orange-50 text-orange-700 ring-orange-200',
  critical: 'bg-red-50 text-red-700 ring-red-300',
};

const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset';

export function StatusBadge({ status }: { status: TicketStatus }) {
  return <span className={`${base} ${statusStyle[status] ?? 'bg-gray-100 text-gray-700 ring-gray-200'}`}>{label(status)}</span>;
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return <span className={`${base} ${priorityStyle[priority]}`}>{label(priority)}</span>;
}
