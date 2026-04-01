<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('name');
            $table->string('first_name', 100)->nullable()->after('id');
            $table->string('last_name', 100)->nullable()->after('first_name');
            $table->string('password')->nullable()->change();
            $table->string('google_id', 255)->unique()->nullable()->after('remember_token');
            $table->string('linkedin_id', 255)->unique()->nullable()->after('google_id');
            $table->string('avatar_url', 500)->nullable()->after('linkedin_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['first_name', 'last_name', 'google_id', 'linkedin_id', 'avatar_url']);
            $table->string('name')->after('id');
            $table->string('password')->nullable(false)->change();
        });
    }
};
