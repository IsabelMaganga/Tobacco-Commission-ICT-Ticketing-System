<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminConfigurationTest extends TestCase
{
    use RefreshDatabase;

    public function test_configuration_api_is_admin_only(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'manager']));
        $this->getJson('/api/v1/admin/slas')->assertForbidden();

        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $this->getJson('/api/v1/admin/slas')->assertOk()->assertJsonPath('data', []);
    }

    public function test_ticket_creation_uses_configured_sla_and_routing_rule(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $requester = User::factory()->create(['role' => 'requester']);
        $groupId = DB::table('groups')->insertGetId(['name' => 'Network Team', 'created_at' => now(), 'updated_at' => now()]);
        $categoryId = DB::table('categories')->insertGetId(['name' => 'Network', 'created_at' => now(), 'updated_at' => now()]);
        $agent = User::factory()->create(['role' => 'tier_1']);
        $agent->supportGroups()->attach($groupId, ['availability' => 'AVAILABLE', 'max_ticket_capacity' => 5]);

        Sanctum::actingAs($admin);
        $this->postJson('/api/v1/admin/slas', [
            'priority' => 'P1',
            'response_time_mins' => 7,
            'resolution_time_mins' => 31,
            'business_hours_only' => false,
        ])->assertCreated();
        $this->postJson('/api/v1/admin/routing-rules', [
            'name' => 'Network route',
            'conditions' => ['field' => 'category_id', 'operator' => 'EQUALS', 'value' => (string) $categoryId],
            'target_group_id' => $groupId,
        ])->assertCreated();

        Sanctum::actingAs($requester);
        $response = $this->postJson('/api/tickets', [
            'title' => 'Network outage',
            'description' => 'The network is unavailable.',
            'category_id' => $categoryId,
            'urgency' => 'high',
            'impact' => 'high',
        ])->assertCreated();

        $ticket = $response->json('data');
        $this->assertSame($groupId, $ticket['assigned_group_id']);
        $this->assertSame($agent->id, $ticket['assignee_id']);
        $this->assertEqualsWithDelta(7, now()->diffInMinutes($ticket['sla_response_deadline'], false), 0.1, 'Configured response target was not applied.');
        $this->assertEqualsWithDelta(31, now()->diffInMinutes($ticket['sla_resolution_deadline'], false), 0.1, 'Configured resolution target was not applied.');
    }

    public function test_automatic_assignment_skips_out_of_office_agents(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $requester = User::factory()->create(['role' => 'requester']);
        $agent = User::factory()->create(['role' => 'tier_1']);
        $groupId = DB::table('groups')->insertGetId(['name' => 'Helpdesk', 'created_at' => now(), 'updated_at' => now()]);
        $categoryId = DB::table('categories')->insertGetId(['name' => 'Hardware', 'created_at' => now(), 'updated_at' => now()]);

        $agent->supportGroups()->attach($groupId, ['availability' => 'OUT_OF_OFFICE', 'max_ticket_capacity' => 5]);
        Sanctum::actingAs($admin);
        $this->postJson('/api/v1/admin/routing-rules', [
            'name' => 'Hardware route',
            'conditions' => ['field' => 'category_id', 'operator' => 'EQUALS', 'value' => (string) $categoryId],
            'target_group_id' => $groupId,
        ])->assertCreated();

        Sanctum::actingAs($requester);
        $this->postJson('/api/tickets', [
            'title' => 'Laptop issue',
            'description' => 'Laptop will not start.',
            'category_id' => $categoryId,
            'urgency' => 'low',
            'impact' => 'low',
        ])->assertCreated()->assertJsonPath('data.assigned_group_id', $groupId)->assertJsonPath('data.assignee_id', null);
    }

    public function test_legacy_ticket_form_payload_is_normalized(): void
    {
        $requester = User::factory()->create(['role' => 'requester']);
        DB::table('categories')->insert(['name' => 'Hardware', 'created_at' => now(), 'updated_at' => now()]);

        Sanctum::actingAs($requester);
        $this->postJson('/api/tickets', [
            'title' => 'Printer issue',
            'description' => 'The printer is not responding.',
            'category' => 'hardware',
            'priority' => 'medium',
        ])->assertCreated()->assertJsonPath('data.status', 'NEW');
    }

    public function test_onboarded_user_is_returned_by_admin_user_list(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        $this->postJson('/api/v1/admin/users', [
            'name' => 'New Agent',
            'email' => 'new.agent@example.test',
            'password' => 'password123',
            'role' => 'TIER_1',
        ])->assertCreated();

        $this->getJson('/api/users')->assertOk()->assertJsonFragment(['email' => 'new.agent@example.test']);
    }
}
