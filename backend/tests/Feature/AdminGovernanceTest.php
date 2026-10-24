<?php

namespace Tests\Feature;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminGovernanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_intervene_pause_and_redact_a_ticket(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $requester = User::factory()->create(['role' => 'requester']);
        $categoryId = DB::table('categories')->insertGetId(['name' => 'Security', 'created_at' => now(), 'updated_at' => now()]);
        $ticket = Ticket::create([
            'ticket_number' => 'TC-TEST-00001',
            'title' => 'Test ticket',
            'description' => 'Sensitive content',
            'category_id' => $categoryId,
            'priority' => 'medium',
            'urgency' => 'medium',
            'impact' => 'medium',
            'status' => 'NEW',
            'requester_id' => $requester->id,
            'sla_response_deadline' => now()->addHour(),
            'sla_resolution_deadline' => now()->addHours(4),
        ]);

        Sanctum::actingAs($admin);
        $this->patchJson("/api/v1/admin/tickets/{$ticket->id}", ['status' => 'IN_PROGRESS', 'priority' => 'high'])->assertOk();
        $this->patchJson("/api/v1/admin/tickets/{$ticket->id}/sla", ['paused' => true, 'reason' => 'Vendor outage', 'extend_minutes' => 30])->assertOk()->assertJsonPath('data.sla_paused', true);
        $this->patchJson("/api/v1/admin/tickets/{$ticket->id}/redact", ['reason' => 'Credential pasted by mistake'])->assertOk()->assertJsonPath('data.description', '[REDACTED BY ADMIN]');

        $this->assertDatabaseHas('audit_logs', ['action' => 'ticket.admin_intervention']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'ticket.sla_paused']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'ticket.description_redacted']);
    }
}
