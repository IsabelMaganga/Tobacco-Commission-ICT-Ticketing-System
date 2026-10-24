<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RoutingRule extends Model
{
    protected $fillable = ['name', 'conditions', 'target_group_id', 'is_active', 'priority'];
    protected $casts = ['conditions' => 'array', 'is_active' => 'boolean'];

    public function targetGroup(): BelongsTo
    {
        return $this->belongsTo(SupportGroup::class, 'target_group_id');
    }
}