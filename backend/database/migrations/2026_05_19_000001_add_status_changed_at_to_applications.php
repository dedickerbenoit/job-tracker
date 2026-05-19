<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->timestamp('status_changed_at')->nullable()->after('applied_at');
        });

        // Backfill existing rows: use created_at as initial value
        DB::statement('UPDATE applications SET status_changed_at = created_at WHERE status_changed_at IS NULL');
    }

    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->dropColumn('status_changed_at');
        });
    }
};
