<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SupportConfigurationSeeder extends Seeder
{
    public function run(): void
    {
        $groups = [
            'Tier 1 Helpdesk' => 'Frontline support and triage',
            'Network Infrastructure Team' => 'Network and connectivity support',
            'Tier 2 Database Admins' => 'Database and application support',
            'Tier 3 DevOps' => 'Infrastructure and DevOps support',
        ];

        foreach ($groups as $name => $description) {
            DB::table('groups')->updateOrInsert(['name' => $name], [
                'description' => $description,
                'is_active' => true,
                'updated_at' => now(),
                'created_at' => now(),
            ]);
        }

        $tierOneId = DB::table('groups')->where('name', 'Tier 1 Helpdesk')->value('id');
        $officerId = DB::table('users')->where('email', 'officer@tc.mw')->value('id');
        if ($tierOneId && $officerId) {
            DB::table('group_user')->updateOrInsert(
                ['group_id' => $tierOneId, 'user_id' => $officerId],
                ['availability' => 'AVAILABLE', 'max_ticket_capacity' => 10, 'updated_at' => now(), 'created_at' => now()]
            );
        }

        $networkGroupId = DB::table('groups')->where('name', 'Network Infrastructure Team')->value('id');
        foreach (['Network', 'Hardware', 'Software', 'Email', 'Access', 'Other'] as $name) {
            DB::table('categories')->updateOrInsert(['name' => $name], [
                'assigned_group_id' => $networkGroupId && $name === 'Network' ? $networkGroupId : null,
                'updated_at' => now(),
                'created_at' => now(),
            ]);
        }

        $policies = [
            ['P1', 15, 120],
            ['P2', 60, 480],
            ['P3', 240, 1440],
            ['P4', 480, 2880],
        ];
        foreach ($policies as [$priority, $response, $resolution]) {
            DB::table('sla_policies')->updateOrInsert(['priority' => $priority], [
                'response_time_mins' => $response,
                'resolution_time_mins' => $resolution,
                'business_hours_only' => false,
                'updated_at' => now(),
                'created_at' => now(),
            ]);
        }

        foreach (range(0, 6) as $day) {
            $open = $day >= 1 && $day <= 5;
            DB::table('business_hours')->updateOrInsert(['day_of_week' => $day], [
                'opens_at' => $open ? '09:00' : null,
                'closes_at' => $open ? '17:00' : null,
                'is_open' => $open,
                'updated_at' => now(),
                'created_at' => now(),
            ]);
        }
    }
}
