<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        Schema::create('groups', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->foreignId('assigned_group_id')->nullable()->constrained('groups')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_number')->unique();
            $table->string('title', 150);
            $table->text('description');
            $table->foreignId('category_id')->constrained('categories');
            $table->enum('priority', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->enum('status', ['NEW', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED'])->default('NEW');
            $table->enum('urgency', ['low', 'medium', 'high']);
            $table->enum('impact', ['low', 'medium', 'high']);
            $table->foreignId('requester_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('assignee_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('assigned_group_id')->nullable()->constrained('groups')->nullOnDelete();
            $table->timestamp('sla_response_deadline');
            $table->timestamp('sla_resolution_deadline');
            $table->enum('sla_response_status', ['ACTIVE', 'MET', 'BREACHED'])->default('ACTIVE');
            $table->enum('sla_resolution_status', ['ACTIVE', 'MET', 'BREACHED'])->default('ACTIVE');
            $table->text('resolution_notes')->nullable();
            $table->string('pending_reason')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'priority']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tickets');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('groups');
        Schema::dropIfExists('departments');
    }
};