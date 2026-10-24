<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            $table->string('description')->nullable();
            $table->unsignedInteger('max_ticket_capacity')->nullable();
            $table->boolean('is_active')->default(true);
        });

        Schema::create('group_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained('groups')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedInteger('max_ticket_capacity')->nullable();
            $table->enum('availability', ['AVAILABLE', 'OUT_OF_OFFICE'])->default('AVAILABLE');
            $table->timestamps();
            $table->unique(['group_id', 'user_id']);
        });

        Schema::create('sla_policies', function (Blueprint $table) {
            $table->id();
            $table->enum('priority', ['P1', 'P2', 'P3', 'P4'])->unique();
            $table->unsignedInteger('response_time_mins');
            $table->unsignedInteger('resolution_time_mins');
            $table->boolean('business_hours_only')->default(false);
            $table->timestamps();
        });

        Schema::create('business_hours', function (Blueprint $table) {
            $table->id();
            $table->unsignedTinyInteger('day_of_week');
            $table->time('opens_at')->nullable();
            $table->time('closes_at')->nullable();
            $table->boolean('is_open')->default(true);
            $table->timestamps();
            $table->unique('day_of_week');
        });

        Schema::create('holidays', function (Blueprint $table) {
            $table->id();
            $table->date('holiday_date')->unique();
            $table->string('name');
            $table->timestamps();
        });

        Schema::create('routing_rules', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->json('conditions');
            $table->foreignId('target_group_id')->constrained('groups')->cascadeOnDelete();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('priority')->default(100);
            $table->timestamps();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action');
            $table->string('auditable_type')->nullable();
            $table->unsignedBigInteger('auditable_id')->nullable();
            $table->json('metadata')->nullable();
            $table->ipAddress('ip_address')->nullable();
            $table->timestamps();
            $table->index(['auditable_type', 'auditable_id']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('routing_rules');
        Schema::dropIfExists('holidays');
        Schema::dropIfExists('business_hours');
        Schema::dropIfExists('sla_policies');
        Schema::dropIfExists('group_user');
        Schema::table('groups', function (Blueprint $table) {
            $table->dropColumn(['description', 'max_ticket_capacity', 'is_active']);
        });
    }
};