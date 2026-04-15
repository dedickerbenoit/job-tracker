<?php

namespace App\Console\Commands;

use App\Models\UserConsent;
use Illuminate\Console\Command;

class CleanupExpiredConsents extends Command
{
    protected $signature = 'app:cleanup-expired-consents';

    protected $description = 'Purge orphaned consent records older than 5 years (RGPD retention)';

    public function handle(): int
    {
        $cutoff = now()->subYears(5);

        $count = UserConsent::whereNull('user_id')
            ->where('consented_at', '<=', $cutoff)
            ->delete();

        $this->info("Purged {$count} expired consent record(s).");

        return self::SUCCESS;
    }
}
