<?php

use App\Http\Middleware\EnsureAccountNotSuspended;
use App\Http\Middleware\EnsureEmailIsVerified;
use App\Http\Middleware\EnsureUserIsAdmin;
use App\Http\Middleware\SecurityHeaders;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(at: '*');

        $middleware->append(SecurityHeaders::class);

        $middleware->alias([
            'verified' => EnsureEmailIsVerified::class,
            'not-suspended' => EnsureAccountNotSuspended::class,
            'admin' => EnsureUserIsAdmin::class,
        ]);

        // Enable Sanctum SPA mode for stateful authentication with HttpOnly cookies
        $middleware->api(prepend: [
            EnsureFrontendRequestsAreStateful::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
