<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_consents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('consent_type', ['terms', 'privacy']);
            $table->timestamp('consented_at');
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->timestamp('revoked_at')->nullable();

            $table->index(['user_id', 'consent_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_consents');
    }
};
