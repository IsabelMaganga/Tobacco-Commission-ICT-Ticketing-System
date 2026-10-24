<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        $user = $request->user();
        $query = Ticket::query();

        if (in_array($user->role, ['staff', 'requester'], true)) {
            $query->where('requester_id', $user->id);
        }

        if (in_array($user->role, ['ict_officer', 'tier_1', 'tier_2_3'], true)) {
            $query->where(fn ($builder) => $builder->where('assignee_id', $user->id)->orWhereNull('assignee_id'));
        }

        $tickets = $query->get(['status', 'priority']);

        return response()->json([
            'total' => $tickets->count(),
            'new' => $tickets->where('status', 'NEW')->count(),
            'in_progress' => $tickets->where('status', 'IN_PROGRESS')->count(),
            'pending' => $tickets->where('status', 'PENDING')->count(),
            'resolved' => $tickets->where('status', 'RESOLVED')->count(),
            'closed' => $tickets->where('status', 'CLOSED')->count(),
            'critical' => $tickets->where('priority', 'critical')->count(),
            'by_priority' => [
                'low' => $tickets->where('priority', 'low')->count(),
                'medium' => $tickets->where('priority', 'medium')->count(),
                'high' => $tickets->where('priority', 'high')->count(),
                'critical' => $tickets->where('priority', 'critical')->count(),
            ],
        ]);
    }
}
