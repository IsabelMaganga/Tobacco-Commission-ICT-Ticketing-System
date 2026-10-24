<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class SupportGroup extends Model
{
    protected $table = 'groups';
    protected $fillable = ['name', 'description', 'max_ticket_capacity', 'is_active'];
    protected $casts = ['is_active' => 'boolean'];

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'group_user', 'group_id', 'user_id')->withPivot(['max_ticket_capacity', 'availability'])->withTimestamps();
    }
}