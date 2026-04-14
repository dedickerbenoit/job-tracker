<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Laravel\Sanctum\PersonalAccessToken;

class CleanupTokens extends Command
{
    protected $signature = 'app:cleanup-tokens';

    protected $description = 'Purge Sanctum tokens unused for more than 30 days';

    public function handle(): int
    {
        $cutoff = now()->subDays(30);

        $count = PersonalAccessToken::where(function ($query) use ($cutoff) {
            $query->whereNull('last_used_at')
                ->where('created_at', '<=', $cutoff);
        })->orWhere('last_used_at', '<=', $cutoff)
            ->delete();

        $this->info("Purged {$count} expired token(s).");

        return self::SUCCESS;
    }
}
