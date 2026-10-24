<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\BusinessHour;
use App\Models\Holiday;
use App\Models\RoutingRule;
use App\Models\SlaPolicy;
use App\Models\SupportGroup;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    public function storeSla(Request $request)
    {
        $data = $request->validate([
            'priority' => ['required', Rule::in(['P1', 'P2', 'P3', 'P4'])],
            'response_time_mins' => ['required', 'integer', 'min:1'],
            'resolution_time_mins' => ['required', 'integer', 'min:1'],
            'business_hours_only' => ['sometimes', 'boolean'],
        ]);
        $policy = SlaPolicy::updateOrCreate(['priority' => $data['priority']], $data);
        $this->audit($request, 'sla_policy.updated', $policy, $data);
        return response()->json(['data' => $policy], 201);
    }

    public function indexSlas()
    {
        return response()->json(['data' => SlaPolicy::orderBy('priority')->get()]);
    }

    public function indexBusinessHours()
    {
        return response()->json(['data' => BusinessHour::orderBy('day_of_week')->get()]);
    }

    public function indexHolidays()
    {
        return response()->json(['data' => Holiday::orderBy('holiday_date')->get()]);
    }

    public function indexRoutingRules()
    {
        return response()->json(['data' => RoutingRule::with('targetGroup')->orderBy('priority')->get()]);
    }

    public function indexGroups()
    {
        return response()->json(['data' => SupportGroup::withCount('users')->orderBy('name')->get()]);
    }

    public function workload()
    {
        $users = User::query()
            ->whereIn('role', ['tier_1', 'tier_2_3', 'ict_officer'])
            ->with(['supportGroups:id,name'])
            ->withCount(['assignedTickets as active_ticket_count' => fn ($query) => $query->whereNotIn('status', ['RESOLVED', 'CLOSED'])])
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role']);

        return response()->json(['data' => $users->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'active_ticket_count' => $user->active_ticket_count,
                'groups' => $user->supportGroups->map(fn ($group) => [
                    'id' => $group->id,
                    'name' => $group->name,
                    'availability' => $group->pivot->availability,
                    'max_ticket_capacity' => $group->pivot->max_ticket_capacity,
                ]),
            ];
        })]);
    }

    public function onboardUser(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::in(['REQUESTER', 'TIER_1', 'TIER_2_3', 'MANAGER'])],
            'department' => ['nullable', 'string', 'max:255'],
            'group_ids' => ['sometimes', 'array'],
            'group_ids.*' => ['integer', 'exists:groups,id'],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => strtolower($data['email']),
            'password' => Hash::make($data['password']),
            'role' => strtolower($data['role']),
            'department' => $data['department'] ?? null,
        ]);
        $user->supportGroups()->sync($data['group_ids'] ?? []);
        $this->audit($request, 'user.onboarded', $user, ['role' => $data['role'], 'group_ids' => $data['group_ids'] ?? []]);

        return response()->json(['data' => $user->load('supportGroups')], 201);
    }

    public function storeBusinessHour(Request $request)
    {
        $data = $request->validate([
            'day_of_week' => ['required', 'integer', 'between:0,6'],
            'opens_at' => ['nullable', 'date_format:H:i'],
            'closes_at' => ['nullable', 'date_format:H:i'],
            'is_open' => ['required', 'boolean'],
        ]);
        $hours = BusinessHour::updateOrCreate(['day_of_week' => $data['day_of_week']], $data);
        $this->audit($request, 'business_hours.updated', $hours, $data);
        return response()->json(['data' => $hours]);
    }

    public function storeHoliday(Request $request)
    {
        $data = $request->validate(['holiday_date' => ['required', 'date'], 'name' => ['required', 'string', 'max:150']]);
        $holiday = Holiday::updateOrCreate(['holiday_date' => $data['holiday_date']], $data);
        $this->audit($request, 'holiday.updated', $holiday, $data);
        return response()->json(['data' => $holiday], 201);
    }

    public function storeRoutingRule(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'conditions' => ['required', 'array'],
            'conditions.field' => ['required', 'string'],
            'conditions.operator' => ['required', Rule::in(['EQUALS'])],
            'conditions.value' => ['required'],
            'target_group_id' => ['required', 'exists:groups,id'],
            'is_active' => ['sometimes', 'boolean'],
            'priority' => ['sometimes', 'integer', 'min:1'],
        ]);
        $rule = RoutingRule::create($data);
        $this->audit($request, 'routing_rule.created', $rule, $data);
        return response()->json(['data' => $rule], 201);
    }

    public function storeGroup(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150', 'unique:groups,name'],
            'description' => ['nullable', 'string'],
            'max_ticket_capacity' => ['nullable', 'integer', 'min:1'],
        ]);
        $group = SupportGroup::create($data);
        $this->audit($request, 'support_group.created', $group, $data);
        return response()->json(['data' => $group], 201);
    }

    public function assignRole(Request $request, User $user)
    {
        $data = $request->validate([
            'role' => ['required', Rule::in(['REQUESTER', 'TIER_1', 'TIER_2_3', 'MANAGER', 'ADMIN'])],
            'group_ids' => ['sometimes', 'array'],
            'group_ids.*' => ['integer', 'exists:groups,id'],
        ]);
        $role = strtolower($data['role']);
        $user->update(['role' => $role === 'admin' ? 'admin' : $role]);
        if (array_key_exists('group_ids', $data)) {
            $user->supportGroups()->sync($data['group_ids']);
        }
        $this->audit($request, 'user.role_updated', $user, ['role' => $data['role'], 'group_ids' => $data['group_ids'] ?? null]);
        return response()->json(['data' => $user->fresh()->load('supportGroups')]);
    }

    public function updateAvailability(Request $request, User $user)
    {
        $data = $request->validate([
            'group_id' => ['required', 'exists:groups,id'],
            'availability' => ['required', Rule::in(['AVAILABLE', 'OUT_OF_OFFICE'])],
            'max_ticket_capacity' => ['nullable', 'integer', 'min:1'],
        ]);
        $user->supportGroups()->updateExistingPivot($data['group_id'], collect($data)->except('group_id')->all());
        $this->audit($request, 'user.availability_updated', $user, $data);
        return response()->json(['data' => $user->fresh()->load('supportGroups')]);
    }

    public function destroyTicket(Request $request, Ticket $ticket)
    {
        $this->audit($request, 'ticket.hard_deleted', $ticket, ['ticket_number' => $ticket->ticket_number]);
        $ticket->delete();
        return response()->noContent();
    }

    public function interveneTicket(Request $request, Ticket $ticket)
    {
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:150'],
            'description' => ['sometimes', 'string'],
            'status' => ['sometimes', Rule::in(['NEW', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED'])],
            'priority' => ['sometimes', Rule::in(['low', 'medium', 'high', 'critical'])],
            'category_id' => ['sometimes', 'nullable', 'exists:categories,id'],
            'assignee_id' => ['sometimes', 'nullable', 'exists:users,id'],
            'assigned_group_id' => ['sometimes', 'nullable', 'exists:groups,id'],
        ]);
        $before = $ticket->only(array_keys($data));
        $ticket->fill($data);
        if (($data['status'] ?? null) === 'RESOLVED' && ! $ticket->resolved_at) {
            $ticket->resolved_at = now();
        }
        $ticket->save();
        $this->audit($request, 'ticket.admin_intervention', $ticket, ['before' => $before, 'after' => $data]);
        return response()->json(['data' => $ticket->fresh()->load(['requester', 'assignee', 'interactions.author'])]);
    }

    public function pauseSla(Request $request, Ticket $ticket)
    {
        $data = $request->validate([
            'paused' => ['required', 'boolean'],
            'reason' => ['required_if:paused,true', 'nullable', 'string', 'max:500'],
            'expires_at' => ['nullable', 'date', 'after:now'],
            'extend_minutes' => ['nullable', 'integer', 'min:1', 'max:100000'],
        ]);
        $ticket->sla_paused = $data['paused'];
        $ticket->sla_paused_at = $data['paused'] ? now() : null;
        $ticket->sla_pause_reason = $data['paused'] ? ($data['reason'] ?? null) : null;
        $ticket->sla_pause_expires_at = $data['paused'] ? ($data['expires_at'] ?? null) : null;
        if (! empty($data['extend_minutes'])) {
            $ticket->sla_response_deadline = $ticket->sla_response_deadline?->addMinutes($data['extend_minutes']);
            $ticket->sla_resolution_deadline = $ticket->sla_resolution_deadline?->addMinutes($data['extend_minutes']);
        }
        $ticket->save();
        $this->audit($request, $data['paused'] ? 'ticket.sla_paused' : 'ticket.sla_resumed', $ticket, $data);
        return response()->json(['data' => $ticket->fresh()]);
    }

    public function redactTicket(Request $request, Ticket $ticket)
    {
        $data = $request->validate(['reason' => ['required', 'string', 'max:500']]);
        $ticket->update(['description' => '[REDACTED BY ADMIN]', 'description_redacted_at' => now()]);
        $this->audit($request, 'ticket.description_redacted', $ticket, ['reason' => $data['reason']]);
        return response()->json(['data' => $ticket->fresh()]);
    }

    public function auditLogs(Request $request)
    {
        $logs = AuditLog::with('actor:id,name,email,role')->latest()->paginate($request->integer('limit', 50));
        return response()->json($logs);
    }

    public function analytics()
    {
        $total = Ticket::count();
        $resolvedTickets = Ticket::whereNotNull('resolved_at')->get(['created_at', 'resolved_at']);
        $mttr = $resolvedTickets->isEmpty()
            ? 0
            : round($resolvedTickets->avg(fn ($ticket) => $ticket->created_at->diffInMinutes($ticket->resolved_at)), 2);
        $responseMinutes = Ticket::query()->whereHas('interactions', function ($query) {
            $query->whereIn('interaction_type', ['PUBLIC_COMMENT', 'INTERNAL_NOTE']);
        })->with(['interactions' => fn ($query) => $query->whereIn('interaction_type', ['PUBLIC_COMMENT', 'INTERNAL_NOTE'])->oldest()])->get()->map(function ($ticket) {
            $first = $ticket->interactions->first();
            return $first ? $ticket->created_at->diffInMinutes($first->created_at) : null;
        })->filter();
        return response()->json(['data' => [
            'first_response_time_minutes' => $responseMinutes->isEmpty() ? 0 : round($responseMinutes->avg(), 2),
            'first_response_breach_rate' => $total ? round(Ticket::where('sla_response_status', 'BREACHED')->count() / $total * 100, 2) : 0,
            'resolution_breach_rate' => $total ? round(Ticket::where('sla_resolution_status', 'BREACHED')->count() / $total * 100, 2) : 0,
            'mean_time_to_resolution_minutes' => $mttr,
            'backlog_by_group' => Ticket::select('assigned_group_id')->selectRaw('COUNT(*) as total')->whereNotIn('status', ['RESOLVED', 'CLOSED'])->groupBy('assigned_group_id')->get(),
        ]]);
    }

    private function audit(Request $request, string $action, object $model, array $metadata): void
    {
        AuditLog::create([
            'actor_id' => $request->user()->id,
            'action' => $action,
            'auditable_type' => $model::class,
            'auditable_id' => $model->getKey(),
            'metadata' => $metadata,
            'ip_address' => $request->ip(),
        ]);
    }
}
