<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ticket extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_number', 'title', 'description', 'category_id', 'priority', 'urgency',
        'impact', 'status', 'requester_id', 'assignee_id', 'assigned_group_id',
        'sla_response_deadline', 'sla_resolution_deadline', 'sla_response_status',
        'sla_resolution_status', 'resolution_notes', 'pending_reason', 'resolved_at',
    ];

    protected $casts = [
        'resolved_at' => 'datetime',
        'sla_response_deadline' => 'datetime',
        'sla_resolution_deadline' => 'datetime',
    ];

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function reporter(): BelongsTo
    {
        return $this->requester();
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(TicketComment::class);
    }

    public function interactions(): HasMany
    {
        return $this->hasMany(TicketInteraction::class);
    }

    /** Auto-generate a unique ticket number like TC-2026-00001 */
    public static function generateTicketNumber(): string
    {
        $year  = now()->year;
        $count = self::whereYear('created_at', $year)->count() + 1;
        return sprintf('TC-%d-%05d', $year, $count);
    }
}