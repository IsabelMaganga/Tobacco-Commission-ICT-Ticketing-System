import Link from 'next/link';
import { Ticket, label, formatDate } from '@/lib/ticket-types';
import { PriorityBadge, StatusBadge } from './TicketBadges';

export default function TicketCard({ ticket }: { ticket: Ticket }) {
  return (
    <Link
      href={`/tickets/${ticket.id}`}
      className="block rounded-lg border border-gray-200 bg-white p-4 transition hover:border-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-700"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500">{ticket.ticket_number}</p>
          <h3 className="mt-0.5 truncate font-semibold text-gray-900">{ticket.title}</h3>
        </div>
        <div className="flex gap-2">
          <PriorityBadge priority={ticket.priority} />
          <StatusBadge status={ticket.status} />
        </div>
      </div>
      <p className="mt-2 text-sm text-gray-500">
        {label(ticket.category)} · {ticket.reporter?.name ?? 'Unknown reporter'} · {formatDate(ticket.created_at)}
      </p>
    </Link>
  );
}
