<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketInteraction extends Model
{
    protected $fillable = ['ticket_id', 'author_id', 'interaction_type', 'body', 'system_metadata'];

    protected $casts = ['system_metadata' => 'array'];

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}