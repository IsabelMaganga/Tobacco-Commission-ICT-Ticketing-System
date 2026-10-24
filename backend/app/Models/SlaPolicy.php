<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SlaPolicy extends Model
{
    protected $fillable = ['priority', 'response_time_mins', 'resolution_time_mins', 'business_hours_only'];
    protected $casts = ['business_hours_only' => 'boolean'];
}