<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title', 255);
            $table->string('company', 255);
            $table->string('location', 255);
            $table->string('url', 2048);
            $table->text('description')->nullable();
            $table->string('source');
            $table->string('status')->default('to_apply');
            $table->text('notes')->nullable();
            $table->timestamp('applied_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status'], 'idx_user_status');
            $table->index(['user_id', 'created_at'], 'idx_user_created');
            $table->index(['user_id', 'url'], 'idx_user_url');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('applications');
    }
};
