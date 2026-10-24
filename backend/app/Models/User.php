<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'department',
        'phone',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /* ------------------------------------------------------------------ */
    /* Relationships                                                       */
    /* ------------------------------------------------------------------ */

    /** Tickets this user reported (submitted). */
    public function reportedTickets(): HasMany
    {
        return $this->hasMany(Ticket::class, 'reporter_id');
    }

    /** Tickets assigned to this user (e.g. an ICT officer). */
    public function assignedTickets(): HasMany
    {
        return $this->hasMany(Ticket::class, 'assignee_id');
    }

    public function supportGroups(): BelongsToMany
    {
        return $this->belongsToMany(SupportGroup::class, 'group_user', 'user_id', 'group_id')->withPivot(['max_ticket_capacity', 'availability'])->withTimestamps();
    }

    /** Comments this user made on tickets. */
    public function comments(): HasMany
    {
        return $this->hasMany(TicketComment::class);
    }

    /* ------------------------------------------------------------------ */
    /* Role helpers                                                        */
    /* ------------------------------------------------------------------ */

    public function isAdmin(): bool
    {
        return in_array($this->role, ['admin', 'manager'], true);
    }

    public function isManager(): bool
    {
        return in_array($this->role, ['admin', 'manager'], true);
    }

    public function isIctOfficer(): bool
    {
        return in_array($this->role, ['ict_officer', 'tier_1', 'tier_2_3'], true);
    }

    public function isStaff(): bool
    {
        return in_array($this->role, ['staff', 'requester'], true);
    }

    /** Can this user see internal-only comments? */
    public function canSeeInternalComments(): bool
    {
        return $this->isManager() || $this->isIctOfficer();
    }

    /** Can this user assign tickets to other users? */
    public function canAssignTickets(): bool
    {
        return $this->isManager() || $this->isIctOfficer();
    }
}