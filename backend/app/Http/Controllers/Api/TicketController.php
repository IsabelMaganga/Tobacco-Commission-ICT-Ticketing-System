<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketInteraction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use App\Services\TicketTriageService;

class TicketController extends Controller
{
    private const TRANSITIONS = [
        'NEW' => ['IN_PROGRESS', 'PENDING'],
        'IN_PROGRESS' => ['PENDING', 'RESOLVED'],
        'PENDING' => ['IN_PROGRESS'],
        'RESOLVED' => ['IN_PROGRESS', 'CLOSED'],
        'CLOSED' => [],
    ];

    public function index(Request $request)
    {
        $user = $request->user();
        $query = Ticket::with(['requester:id,name,email', 'assignee:id,name,email', 'interactions.author:id,name,role']);

        if ($this->isRequester($user)) {
            $query->where('requester_id', $user->id);
        } elseif ($this->isSupportAgent($user)) {
            $query->where(fn ($q) => $q->where('assignee_id', $user->id)->orWhereNull('assignee_id'));
        }

        $query->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('priority'), fn ($q) => $q->where('priority', $request->string('priority')));

        return response()->json($query->latest()->paginate($request->integer('limit', 15)));
    }

    public function store(Request $request, TicketTriageService $triage)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'description' => ['required', 'string'],
            'category_id' => ['nullable', 'exists:categories,id', 'required_without:category'],
            'category' => ['nullable', 'string', 'max:100', 'required_without:category_id'],
            'urgency' => ['nullable', Rule::in(['low', 'medium', 'high'])],
            'impact' => ['nullable', Rule::in(['low', 'medium', 'high'])],
            'priority' => ['nullable', Rule::in(['low', 'medium', 'high', 'critical'])],
        ]);

        if (empty($validated['category_id'])) {
            $validated['category_id'] = DB::table('categories')
                ->whereRaw('LOWER(name) = ?', [strtolower($validated['category'])])
                ->value('id');
            abort_unless($validated['category_id'], 422, 'The selected category is not configured.');
        }

        [$validated['urgency'], $validated['impact']] = $this->triageInputs($validated);

        $priority = $this->priorityFor($validated['impact'], $validated['urgency']);
        $targets = $triage->targets($priority, now());
        $groupId = $triage->route((int) $validated['category_id']);
        $assigneeId = $triage->assignableAgent($groupId);

        $ticket = DB::transaction(function () use ($request, $validated, $priority, $targets, $groupId, $assigneeId) {
            $ticket = Ticket::create([
                ...$validated,
                'ticket_number' => Ticket::generateTicketNumber(),
                'requester_id' => $request->user()->id,
                'priority' => $priority,
                'status' => 'NEW',
                'assigned_group_id' => $groupId,
                'assignee_id' => $assigneeId,
                'sla_response_deadline' => $targets['response'],
                'sla_resolution_deadline' => $targets['resolution'],
            ]);
            $this->log($ticket, $request->user()->id, 'Ticket created and triaged.', ['event' => 'ticket.created', 'assigned_group_id' => $groupId, 'assignee_id' => $assigneeId]);
            return $ticket;
        });

        return response()->json(['data' => $ticket->fresh()->load('interactions')], 201);
    }

    public function show(Request $request, Ticket $ticket)
    {
        $this->assertCanAccess($request->user(), $ticket);
        return response()->json(['data' => $ticket->load(['requester', 'assignee', 'interactions.author'])]);
    }

    public function update(Request $request, Ticket $ticket)
    {
        $this->assertCanAccess($request->user(), $ticket);
        $ticket->update($request->validate(['title' => ['sometimes', 'string', 'max:150'], 'description' => ['sometimes', 'string']]));
        return response()->json(['data' => $ticket->fresh()]);
    }

    public function updateStatus(Request $request, Ticket $ticket)
    {
        $user = $request->user();
        $this->assertCanAccess($user, $ticket);
        $data = $request->validate(['target_status' => ['required', Rule::in(['NEW', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED'])], 'reason_notes' => ['nullable', 'string']]);
        abort_unless(in_array($data['target_status'], self::TRANSITIONS[$ticket->status] ?? [], true), 422, 'Invalid ticket status transition.');
        abort_if($data['target_status'] === 'RESOLVED' && blank($data['reason_notes']), 422, 'Resolution notes are required.');
        abort_if($data['target_status'] === 'PENDING' && blank($data['reason_notes']), 422, 'A pending reason is required.');

        $oldStatus = $ticket->status;
        $ticket->status = $data['target_status'];
        $ticket->pending_reason = $data['target_status'] === 'PENDING' ? $data['reason_notes'] : null;
        $ticket->resolution_notes = $data['target_status'] === 'RESOLVED' ? $data['reason_notes'] : $ticket->resolution_notes;
        $ticket->resolved_at = $data['target_status'] === 'RESOLVED' ? now() : null;
        if ($data['target_status'] === 'RESOLVED' && now()->lte($ticket->sla_resolution_deadline)) {
            $ticket->sla_resolution_status = 'MET';
        }
        $ticket->save();
        $this->log($ticket, $user->id, "Status changed from {$oldStatus} to {$ticket->status}.", ['field' => 'status', 'old' => $oldStatus, 'new' => $ticket->status]);
        return response()->json(['data' => $ticket->fresh()]);
    }

    public function storeInteraction(Request $request, Ticket $ticket)
    {
        $user = $request->user();
        $this->assertCanAccess($user, $ticket);
        $data = $request->validate(['interaction_type' => ['required', Rule::in(['PUBLIC_COMMENT', 'INTERNAL_NOTE'])], 'body' => ['required', 'string']]);
        abort_if($data['interaction_type'] === 'INTERNAL_NOTE' && $this->isRequester($user), 403, 'Requesters cannot create internal notes.');
        $interaction = TicketInteraction::create([...$data, 'ticket_id' => $ticket->id, 'author_id' => $user->id]);
        if ($ticket->status === 'PENDING' && $data['interaction_type'] === 'PUBLIC_COMMENT') {
            $ticket->update(['status' => 'IN_PROGRESS']);
        }
        return response()->json(['data' => $interaction], 201);
    }

    public function assign(Request $request, Ticket $ticket)
    {
        $user = $request->user();
        abort_unless($user->isManager() || $user->isIctOfficer(), 403, 'You cannot assign this ticket.');
        $data = $request->validate(['assignee_id' => ['nullable', 'exists:users,id'], 'assigned_group_id' => ['nullable', 'exists:groups,id']]);
        if ($user->isIctOfficer() && (int) ($data['assignee_id'] ?? 0) !== $user->id) {
            abort(403, 'Support agents can only assign tickets to themselves.');
        }
        $ticket->update($data);
        $this->log($ticket, $user->id, 'Ticket assigned to support agent.', ['assignee_id' => $data['assignee_id'] ?? null, 'assigned_group_id' => $data['assigned_group_id'] ?? null]);
        return response()->json(['data' => $ticket->fresh()->load(['assignee', 'interactions'])]);
    }

    public function overrideSla(Request $request, Ticket $ticket)
    {
        abort_unless($request->user()->isManager(), 403, 'Only managers can override SLA targets.');
        $data = $request->validate([
            'sla_response_deadline' => ['nullable', 'date'],
            'sla_resolution_deadline' => ['nullable', 'date'],
        ]);
        abort_if($data === [], 422, 'At least one SLA deadline is required.');
        $ticket->update($data);
        $this->log($ticket, $request->user()->id, 'SLA targets overridden by manager.', $data);
        return response()->json(['data' => $ticket->fresh()]);
    }

    public function destroy(Request $request, Ticket $ticket)
    {
        abort_unless(in_array($request->user()->role, ['admin', 'manager'], true), 403);
        $ticket->delete();
        return response()->noContent();
    }

    private function priorityFor(string $impact, string $urgency): string
    {
        if ($impact === 'high' && $urgency === 'high') return 'critical';
        if (($impact === 'high' && $urgency === 'medium') || ($impact === 'medium' && $urgency === 'high')) return 'high';
        if ($impact === 'medium' && $urgency === 'medium') return 'medium';
        return 'low';
    }

    private function triageInputs(array $validated): array
    {
        if (! empty($validated['urgency']) && ! empty($validated['impact'])) {
            return [$validated['urgency'], $validated['impact']];
        }

        return match ($validated['priority'] ?? 'medium') {
            'critical' => ['high', 'high'],
            'high' => ['high', 'medium'],
            'low' => ['low', 'low'],
            default => ['medium', 'medium'],
        };
    }

    private function isRequester($user): bool
    {
        return in_array($user->role, ['staff', 'requester'], true);
    }

    private function isSupportAgent($user): bool
    {
        return in_array($user->role, ['ict_officer', 'tier_1', 'tier_2_3'], true);
    }

    private function assertCanAccess($user, Ticket $ticket): void
    {
        abort_if($this->isRequester($user) && $ticket->requester_id !== $user->id, 403, 'You cannot access this ticket.');
        abort_if($this->isSupportAgent($user) && $ticket->assignee_id !== null && $ticket->assignee_id !== $user->id, 403, 'You cannot access this ticket.');
    }

    private function log(Ticket $ticket, int $authorId, string $body, ?array $metadata = null): void
    {
        TicketInteraction::create(['ticket_id' => $ticket->id, 'author_id' => $authorId, 'interaction_type' => $metadata ? 'SYSTEM_LOG' : 'PUBLIC_COMMENT', 'body' => $body, 'system_metadata' => $metadata]);
    }
}
