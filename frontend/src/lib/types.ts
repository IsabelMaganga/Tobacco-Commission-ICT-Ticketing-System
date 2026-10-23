export type Role = 'staff' | 'ict_officer' | 'admin';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketCategory =
  | 'hardware'
  | 'software'
  | 'network'
  | 'email'
  | 'access'
  | 'other';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  department?: string | null;
  phone?: string | null;
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
  reporter?: Pick<User, 'id' | 'name' | 'email' | 'department'>;
  assignee?: Pick<User, 'id' | 'name' | 'email'> | null;
  comments?: Comment[];
}

export interface Comment {
  id: number;
  ticket_id: number;
  user_id: number;
  body: string;
  is_internal: boolean;
  created_at: string;
  user?: Pick<User, 'id' | 'name' | 'role'>;
}

export interface DashboardStats {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
  critical: number;
  by_priority: Record<string, number>;
  by_category: Record<string, number>;
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}