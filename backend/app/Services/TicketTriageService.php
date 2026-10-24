<?php

namespace App\Services;

use App\Models\BusinessHour;
use App\Models\Holiday;
use App\Models\RoutingRule;
use App\Models\SlaPolicy;
use App\Models\Ticket;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\DB;

class TicketTriageService
{
    public function targets(string $priority, CarbonInterface $from): array
    {
        $policy = SlaPolicy::where('priority', $this->policyPriority($priority))->first();
        $responseMinutes = $policy?->response_time_mins ?? $this->fallbackMinutes($priority, true);
        $resolutionMinutes = $policy?->resolution_time_mins ?? $this->fallbackMinutes($priority, false);
        $businessHoursOnly = (bool) ($policy?->business_hours_only ?? false);

        return [
            'response' => $this->addMinutes($from, $responseMinutes, $businessHoursOnly),
            'resolution' => $this->addMinutes($from, $resolutionMinutes, $businessHoursOnly),
        ];
    }

    public function route(int $categoryId): ?int
    {
        $rules = RoutingRule::query()->where('is_active', true)->orderBy('priority')->get();
        foreach ($rules as $rule) {
            $condition = $rule->conditions;
            if (($condition['field'] ?? null) === 'category_id'
                && ($condition['operator'] ?? null) === 'EQUALS'
                && (string) ($condition['value'] ?? '') === (string) $categoryId) {
                return $rule->target_group_id;
            }
        }

        return DB::table('categories')->whereKey($categoryId)->value('assigned_group_id');
    }

    public function assignableAgent(?int $groupId): ?int
    {
        if (! $groupId) {
            return null;
        }

        return User::query()
            ->whereHas('supportGroups', function ($query) use ($groupId) {
                $query->where('groups.id', $groupId)
                    ->where('group_user.availability', 'AVAILABLE');
            })
            ->with(['supportGroups' => fn ($query) => $query->where('groups.id', $groupId)])
            ->withCount(['assignedTickets as active_ticket_count' => fn ($query) => $query->whereNotIn('status', ['RESOLVED', 'CLOSED'])])
            ->get()
            ->first(fn ($user) => $user->active_ticket_count < (int) ($user->supportGroups->first()->pivot->max_ticket_capacity ?? PHP_INT_MAX))
            ?->id;
    }

    private function addMinutes(CarbonInterface $from, int $minutes, bool $businessHoursOnly): Carbon
    {
        $cursor = Carbon::instance($from)->copy();
        if (! $businessHoursOnly) {
            return $cursor->addMinutes($minutes);
        }

        while ($minutes > 0) {
            if ($this->isBusinessTime($cursor)) {
                $cursor->addMinute();
                $minutes--;
            } else {
                $cursor->addMinute();
            }
        }

        return $cursor;
    }

    private function isBusinessTime(CarbonInterface $date): bool
    {
        if (Holiday::whereDate('holiday_date', $date->toDateString())->exists()) {
            return false;
        }

        $hours = BusinessHour::where('day_of_week', $date->dayOfWeek)->first();
        if (! $hours || ! $hours->is_open || ! $hours->opens_at || ! $hours->closes_at) {
            return false;
        }

        $open = Carbon::parse($date->toDateString().' '.$hours->opens_at);
        $close = Carbon::parse($date->toDateString().' '.$hours->closes_at);
        return $date->betweenIncluded($open, $close);
    }

    private function policyPriority(string $priority): string
    {
        return ['critical' => 'P1', 'high' => 'P2', 'medium' => 'P3', 'low' => 'P4'][$priority] ?? 'P3';
    }

    private function fallbackMinutes(string $priority, bool $response): int
    {
        return match ($priority) {
            'critical' => $response ? 15 : 120,
            'high' => $response ? 60 : 480,
            'medium' => $response ? 240 : 1440,
            default => $response ? 480 : 2880,
        };
    }
}
