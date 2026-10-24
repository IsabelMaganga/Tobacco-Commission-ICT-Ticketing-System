<?php

namespace App\Console\Commands;

use App\Models\Ticket;
use App\Models\TicketInteraction;
use Illuminate\Console\Command;

class MonitorTicketSlas extends Command
{
    protected $signature = 'tickets:monitor-slas';
    protected $description = 'Mark overdue ticket SLAs and record response breaches';

    public function handle(): int
    {
        Ticket::whereNotIn('status', ['RESOLVED', 'CLOSED'])
            ->where('sla_response_status', 'ACTIVE')
            ->where('sla_response_deadline', '<', now())
            ->each(function (Ticket $ticket): void {
                $ticket->update(['sla_response_status' => 'BREACHED']);
                TicketInteraction::create([
                    'ticket_id' => $ticket->id,
                    'author_id' => $ticket->requester_id,
                    'interaction_type' => 'SYSTEM_LOG',
                    'body' => 'Response SLA breached.',
                    'system_metadata' => ['field' => 'sla_response_status', 'new' => 'BREACHED'],
                ]);
            });

        Ticket::whereNotIn('status', ['RESOLVED', 'CLOSED'])
            ->where('sla_resolution_status', 'ACTIVE')
            ->where('sla_resolution_deadline', '<', now())
            ->update(['sla_resolution_status' => 'BREACHED']);

        return self::SUCCESS;
    }
}
