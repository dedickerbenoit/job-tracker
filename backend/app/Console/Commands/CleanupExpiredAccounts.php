<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class CleanupExpiredAccounts extends Command
{
    protected $signature = 'app:cleanup-expired-accounts';

    protected $description = 'Permanently delete user accounts soft-deleted more than 30 days ago';

    public function handle(): int
    {
        $cutoff = now()->subDays(30);

        $users = User::onlyTrashed()
            ->where('deleted_at', '<=', $cutoff)
            ->get();

        $count = $users->count();
        $users->each(fn(User $user) => $user->forceDelete());

        $this->info("Purged {$count} expired account(s).");

        return self::SUCCESS;
    }
}
