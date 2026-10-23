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

        if ($user->role === 'staff') {
            $query->where('reporter_id', $user->id);
        }

        if ($user->role === 'ict_officer') {
            $query->where(function ($q) use ($user) {
                $q->where('assignee_id', $user->id)
                  ->orWhereNull('assignee_id');
            });
        }

        $tickets = $query->get();

        $byPriority = [
            'low' => $tickets->where('priority', 'low')->count(),
            'medium' => $tickets->where('priority', 'medium')->count(),
            'high' => $tickets->where('priority', 'high')->count(),
            'critical' => $tickets->where('priority', 'critical')->count(),
        ];

        $byCategory = [
            'hardware' => $tickets->where('category', 'hardware')->count(),
            'software' => $tickets->where('category', 'software')->count(),
            'network' => $tickets->where('category', 'network')->count(),
            'email' => $tickets->where('category', 'email')->count(),
            'access' => $tickets->where('category', 'access')->count(),
            'other' => $tickets->where('category', 'other')->count(),
        ];

        return response()->json([
            'total' => $tickets->count(),
            'open' => $tickets->where('status', 'open')->count(),
            'in_progress' => $tickets->where('status', 'in_progress')->count(),
            'resolved' => $tickets->where('status', 'resolved')->count(),
            'closed' => $tickets->where('status', 'closed')->count(),
            'critical' => $tickets->where('priority', 'critical')->count(),
            'by_priority' => $byPriority,
            'by_category' => $byCategory,
        ]);
    }
}
