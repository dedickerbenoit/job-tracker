<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class BetaSignupController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email:rfc,dns', 'max:255'],
        ]);

        $email = $validated['email'];

        try {
            Mail::raw(
                "Nouvelle demande d'accès beta pour l'extension Chrome.\n\nEmail : {$email}\n\nAjoute cet utilisateur sur le Chrome Web Store.",
                function ($message) use ($email) {
                    $message->to('dedickerbenoit@gmail.com')
                        ->subject("Beta extension — {$email}");
                }
            );
        } catch (\Throwable $e) {
            Log::warning('Failed to send beta signup notification', [
                'email' => $email,
                'error' => $e->getMessage(),
            ]);
        }

        return response()->json(['message' => 'ok']);
    }
}
