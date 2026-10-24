<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketInteraction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

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
        } elseif ($user->role === 'ict_officer') {
            $query->where(fn ($q) => $q->where('assignee_id', $user->id)->orWhereNull('assignee_id'));
        }

        $query->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('priority'), fn ($q) => $q->where('priority', $request->string('priority')));

        return response()->json($query->latest()->paginate($request->integer('limit', 15)));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'description' => ['required', 'string'],
            'category_id' => ['required', 'exists:categories,id'],
            'urgency' => ['required', Rule::in(['low', 'medium', 'high'])],
            'impact' => ['required', Rule::in(['low', 'medium', 'high'])],
        ]);

        $priority = $this->priorityFor($validated['impact'], $validated['urgency']);
        [$responseMinutes, $resolutionMinutes] = $priority === 'critical' ? [15, 120] : ($priority === 'low' ? [480, 2880] : [60, 480]);
        $groupId = DB::table('categories')->where('id', $validated['category_id'])->value('assigned_group_id');

        $ticket = DB::transaction(function () use ($request, $validated, $priority, $responseMinutes, $resolutionMinutes, $groupId) {
            $ticket = Ticket::create([
                ...$validated,
                'ticket_number' => Ticket::generateTicketNumber(),
                'requester_id' => $request->user()->id,
                'priority' => $priority,
                'status' => 'NEW',
                'assigned_group_id' => $groupId,
                'sla_response_deadline' => now()->addMinutes($responseMinutes),
                'sla_resolution_deadline' => now()->addMinutes($resolutionMinutes),
            ]);
            $this->log($ticket, $request->user()->id, 'Ticket created.');
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
        abort_unless($request->user()->isManager(), 403, 'Only managers can force-reassign tickets.');
        $data = $request->validate(['assignee_id' => ['nullable', 'exists:users,id'], 'assigned_group_id' => ['nullable', 'exists:groups,id']]);
        $ticket->update($data);
        $this->log($ticket, $request->user()->id, 'Ticket assignment overridden by manager.', ['assignee_id' => $data['assignee_id'] ?? null, 'assigned_group_id' => $data['assigned_group_id'] ?? null]);
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

    private function isRequester($user): bool
    {
        return in_array($user->role, ['staff', 'requester'], true);
    }

    private function assertCanAccess($user, Ticket $ticket): void
    {
        abort_if($this->isRequester($user) && $ticket->requester_id !== $user->id, 403, 'You cannot access this ticket.');
        abort_if($user->role === 'ict_officer' && $ticket->assignee_id !== null && $ticket->assignee_id !== $user->id, 403, 'You cannot access this ticket.');
    }

    private function log(Ticket $ticket, int $authorId, string $body, ?array $metadata = null): void
    {
        TicketInteraction::create(['ticket_id' => $ticket->id, 'author_id' => $authorId, 'interaction_type' => $metadata ? 'SYSTEM_LOG' : 'PUBLIC_COMMENT', 'body' => $body, 'system_metadata' => $metadata]);
    }
}
