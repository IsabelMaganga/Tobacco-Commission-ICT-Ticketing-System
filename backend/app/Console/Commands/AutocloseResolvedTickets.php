<?php

namespace App\Console\Commands;

use App\Models\Ticket;
use App\Models\TicketInteraction;
use Illuminate\Console\Command;

class AutocloseResolvedTickets extends Command
{
    protected $signature = 'tickets:autoclose-resolved';
    protected $description = 'Close resolved tickets after the 72-hour grace period';

    public function handle(): int
    {
        Ticket::where('status', 'RESOLVED')
            ->where('resolved_at', '<', now()->subHours(72))
            ->each(function (Ticket $ticket): void {
                $ticket->update(['status' => 'CLOSED']);
                TicketInteraction::create([
                    'ticket_id' => $ticket->id,
                    'author_id' => $ticket->requester_id,
                    'interaction_type' => 'SYSTEM_LOG',
                    'body' => 'Ticket automatically closed after the 72-hour resolution grace period.',
                    'system_metadata' => ['field' => 'status', 'old' => 'RESOLVED', 'new' => 'CLOSED'],
                ]);
            });

        return self::SUCCESS;
    }
}
