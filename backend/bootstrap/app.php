<?php

use App\Exceptions\Account\AccountNotSuspendedException;
use App\Exceptions\Account\ConsentAlreadyActiveException;
use App\Exceptions\Account\ConsentNotFoundException;
use App\Exceptions\Account\MissingConsentsException;
use App\Exceptions\Auth\InvalidCredentialsException;
use App\Exceptions\Auth\InvalidTokenException;
use App\Exceptions\Auth\TooManyAttempsException;
use App\Http\Middleware\EnsureAccountNotSuspended;
use App\Http\Middleware\EnsureEmailIsVerified;
use App\Http\Middleware\EnsureUserIsAdmin;
use App\Http\Middleware\SecurityHeaders;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;
use Symfony\Component\HttpKernel\Exception\HttpException;

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
        $exceptions->dontReport([
            InvalidCredentialsException::class,
            TooManyAttempsException::class,
            InvalidTokenException::class,
            AccountNotSuspendedException::class,
            ConsentAlreadyActiveException::class,
            ConsentNotFoundException::class,
            MissingConsentsException::class,
        ]);

        $exceptions->render(function (HttpException $e, Request $request) {
            if ($request->is('api/*') || $request->is('v1/*')) {
                $data = [
                    'message' => $e->getMessage(),
                ];

                if ($e instanceof MissingConsentsException) {
                    $data['missing_consents'] = $e->missingConsents;
                }

                if ($e instanceof ValidationException) {
                    $data['errors'] = $e->errors();
                }

                return response()->json($data, $e->getStatusCode(), $e->getHeaders());
            }
        });
    })->create();
