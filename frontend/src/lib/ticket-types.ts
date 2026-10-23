export type Role = 'staff' | 'ict_officer' | 'admin';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketCategory = 'hardware' | 'software' | 'network' | 'email' | 'access' | 'other';

export const STATUSES: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed'];
export const PRIORITIES: TicketPriority[] = ['low', 'medium', 'high', 'critical'];
export const CATEGORIES: TicketCategory[] = ['hardware', 'software', 'network', 'email', 'access', 'other'];

export function label(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—';

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '—';

  return parsed.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export interface UserLite {
  id: number;
  name: string;
  email?: string;
  role?: Role;
  department?: string | null;
}

export interface Ticket {
  id: number;
  ticket_number: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  department?: string | null;
  reporter_id: number;
  assignee_id?: number | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
  reporter?: Pick<UserLite, 'id' | 'name' | 'email' | 'department'>;
  assignee?: Pick<UserLite, 'id' | 'name' | 'email'> | null;
  comments?: Comment[];
}

export interface Comment {
  id: number;
  ticket_id: number;
  user_id: number;
  body: string;
  is_internal: boolean;
  created_at: string;
  user?: Pick<UserLite, 'id' | 'name' | 'role'>;
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}
