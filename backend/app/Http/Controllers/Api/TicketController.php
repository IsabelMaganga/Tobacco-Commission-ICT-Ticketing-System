<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TicketController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Ticket::with(['reporter:id,name,email,department', 'assignee:id,name,email'])
            ->when($user->role === 'staff', fn ($q) => $q->where('reporter_id', $user->id))
            ->when($user->role === 'ict_officer', function ($q) use ($user) {
                $q->where(function ($inner) use ($user) {
                    $inner->where('assignee_id', $user->id)
                        ->orWhereNull('assignee_id');
                });
            });

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('ticket_number', 'like', "%{$search}%");
            });
        }

        return response()->json(
            $query->latest()->paginate($request->get('per_page', 10))
        );
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validated = Validator::make($request->all(), [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'category' => ['required', 'in:hardware,software,network,email,access,other'],
            'priority' => ['sometimes', 'in:low,medium,high,critical'],
            'department' => ['nullable', 'string', 'max:255'],
        ])->validate();

        $ticket = Ticket::create([
            'ticket_number' => Ticket::generateTicketNumber(),
            'title' => $validated['title'],
            'description' => $validated['description'],
            'category' => $validated['category'],
            'priority' => $validated['priority'] ?? 'medium',
            'status' => 'open',
            'reporter_id' => $user->id,
            'assignee_id' => $validated['assignee_id'] ?? null,
            'department' => $validated['department'] ?? $user->department,
        ]);

        return response()->json([
            'message' => 'Ticket created successfully.',
            'data' => $ticket->load(['reporter:id,name,email,department', 'assignee:id,name,email']),
        ], 201);
    }

    public function show(Request $request, Ticket $ticket)
    {
        $user = $request->user();

        if ($user->role === 'staff' && $ticket->reporter_id !== $user->id) {
            abort(403, 'You cannot view this ticket.');
        }

        if ($user->role === 'ict_officer' && $ticket->assignee_id !== $user->id && $ticket->reporter_id !== $user->id && !is_null($ticket->assignee_id)) {
            abort(403, 'You cannot view this ticket.');
        }

        return response()->json([
            'data' => $ticket->load(['reporter:id,name,email,department', 'assignee:id,name,email', 'comments.user'])
        ]);
    }

    public function update(Request $request, Ticket $ticket)
    {
        $user = $request->user();

        if ($user->role === 'staff' && $ticket->reporter_id !== $user->id) {
            abort(403, 'You cannot update this ticket.');
        }

        $validated = Validator::make($request->all(), [
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'string'],
            'category' => ['sometimes', 'in:hardware,software,network,email,access,other'],
            'priority' => ['sometimes', 'in:low,medium,high,critical'],
            'status' => ['sometimes', 'in:open,in_progress,resolved,closed'],
            'department' => ['nullable', 'string', 'max:255'],
        ])->validate();

        if (isset($validated['status'])) {
            $validated['resolved_at'] = $validated['status'] === 'resolved' ? now() : null;
        }

        $ticket->fill($validated);
        $ticket->save();

        return response()->json([
            'message' => 'Ticket updated successfully.',
            'data' => $ticket->fresh()->load(['reporter:id,name,email,department', 'assignee:id,name,email']),
        ]);
    }

    public function assign(Request $request, Ticket $ticket)
    {
        $user = $request->user();

        if (! $user->canAssignTickets()) {
            abort(403, 'You cannot assign tickets.');
        }

        $validated = Validator::make($request->all(), [
            'assignee_id' => ['required', 'exists:users,id'],
        ])->validate();

        $ticket->assignee_id = $validated['assignee_id'];
        $ticket->status = 'in_progress';
        $ticket->save();

        return response()->json([
            'message' => 'Ticket assigned successfully.',
            'data' => $ticket->fresh()->load(['reporter:id,name,email,department', 'assignee:id,name,email']),
        ]);
    }

    public function resolve(Request $request, Ticket $ticket)
    {
        $user = $request->user();

        if ($user->role === 'staff' && $ticket->reporter_id !== $user->id) {
            abort(403, 'You cannot resolve this ticket.');
        }

        $ticket->status = 'resolved';
        $ticket->resolved_at = now();
        $ticket->save();

        return response()->json([
            'message' => 'Ticket marked as resolved.',
            'data' => $ticket->fresh()->load(['reporter:id,name,email,department', 'assignee:id,name,email']),
        ]);
    }
}
