<?php

namespace App\Services\Support;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SessionTerminator
{
    public function terminateAllSessions(User $user, Request $request): void
    {
        $user->tokens()->delete();
        $this->invalidateSession($request);
    }

    public function invalidateSession(Request $request)
    {
        Auth::guard('web')->logout();
        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }
    }
}
