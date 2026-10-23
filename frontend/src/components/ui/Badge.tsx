import type {
  TicketPriority,
  TicketStatus,
} from '@/lib/types';

interface StatusBadgeProps {
  status: TicketStatus;
}

interface PriorityBadgeProps {
  priority: TicketPriority;
}

const statusClasses: Record<TicketStatus, string> = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-gray-200 text-gray-700',
};

const priorityClasses: Record<TicketPriority, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusClasses[status]}`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${priorityClasses[priority]}`}
    >
      {priority}
    </span>
  );
}