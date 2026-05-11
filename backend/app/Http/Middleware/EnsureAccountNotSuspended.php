<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAccountNotSuspended
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->suspended_at) {
            return response()->json([
                'message' => 'Votre compte est suspendu (droit à la limitation du traitement). Contactez dedickerbenoit@gmail.com pour lever la restriction.',
            ], 403);
        }

        return $next($request);
    }
}
