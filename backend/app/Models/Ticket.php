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
        'ticket_number', 'title', 'description', 'category',
        'priority', 'status', 'reporter_id', 'assignee_id',
        'department', 'resolved_at',
    ];

    protected $casts = [
        'resolved_at' => 'datetime',
    ];

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(TicketComment::class);
    }

    /** Auto-generate a unique ticket number like TC-2026-00001 */
    public static function generateTicketNumber(): string
    {
        $year  = now()->year;
        $count = self::whereYear('created_at', $year)->count() + 1;
        return sprintf('TC-%d-%05d', $year, $count);
    }
}