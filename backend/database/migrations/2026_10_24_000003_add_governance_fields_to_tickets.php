<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->boolean('sla_paused')->default(false);
            $table->timestamp('sla_paused_at')->nullable();
            $table->string('sla_pause_reason')->nullable();
            $table->timestamp('sla_pause_expires_at')->nullable();
            $table->timestamp('description_redacted_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropColumn(['sla_paused', 'sla_paused_at', 'sla_pause_reason', 'sla_pause_expires_at', 'description_redacted_at']);
        });
    }
};