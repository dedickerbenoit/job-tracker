<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CleanupSessions extends Command
{
    protected $signature = 'app:cleanup-sessions';

    protected $description = 'Purge sessions older than 30 days';

    public function handle(): int
    {
        $cutoff = now()->subDays(30)->getTimestamp();

        $count = DB::table('sessions')
            ->where('last_activity', '<=', $cutoff)
            ->delete();

        $this->info("Purged {$count} expired session(s).");

        return self::SUCCESS;
    }
}
