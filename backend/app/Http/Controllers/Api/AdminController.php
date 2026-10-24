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
            : round($resolvedTickets->avg(fn (Ticket $ticket) => $ticket->created_at->diffInMinutes($ticket->resolved_at)), 2);
        return response()->json(['data' => [
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
