<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketComment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TicketCommentController extends Controller
{
    public function store(Request $request, Ticket $ticket)
    {
        $user = $request->user();

        if ($user->role === 'staff' && $ticket->reporter_id !== $user->id) {
            abort(403, 'You cannot comment on this ticket.');
        }

        if ($user->role === 'ict_officer' && $ticket->assignee_id !== $user->id && $ticket->reporter_id !== $user->id && !is_null($ticket->assignee_id)) {
            abort(403, 'You cannot comment on this ticket.');
        }

        $validated = Validator::make($request->all(), [
            'body' => ['required', 'string'],
            'is_internal' => ['sometimes', 'boolean'],
        ])->validate();

        if (($validated['is_internal'] ?? false) && ! $user->canSeeInternalComments()) {
            abort(403, 'Only ICT support staff can add internal notes.');
        }

        $comment = $ticket->comments()->create([
            'user_id' => $user->id,
            'body' => $validated['body'],
            'is_internal' => $validated['is_internal'] ?? false,
        ]);

        return response()->json([
            'message' => 'Comment posted successfully.',
            'data' => $comment->load('user:id,name,role'),
        ], 201);
    }

    public function destroy(Request $request, Ticket $ticket, TicketComment $comment)
    {
        $user = $request->user();

        if (! $user->canSeeInternalComments() && $comment->user_id !== $user->id) {
            abort(403, 'You cannot delete this comment.');
        }

        if ($comment->ticket_id !== $ticket->id) {
            abort(404, 'Comment not found for this ticket.');
        }

        $comment->delete();

        return response()->json([
            'message' => 'Comment deleted successfully.',
        ]);
    }
}
