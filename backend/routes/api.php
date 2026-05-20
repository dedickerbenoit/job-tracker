<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EmailVerificationController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Health check (public, no auth)
    Route::get('/health', fn () => response()->json(['status' => 'ok']));

    // Auth routes (public, rate-limited)
    Route::middleware('throttle:5,1')->group(function () {
        Route::post('auth/register', [AuthController::class, 'register']);
        Route::post('auth/login', [AuthController::class, 'login']);
        // token-login is intentionally public: it exchanges a short-lived
        // handoff token (Bearer) for a fresh SPA session. Auth is enforced
        // by the controller itself (Bearer + 'handoff' ability check) so the
        // route cannot rely on auth:sanctum (which would resolve stale session
        // cookies via TransientToken and bypass the ability check).
        Route::post('auth/token-login', [AuthController::class, 'tokenLogin']);
    });

    // Email verification — separate, more lenient rate limiter to avoid
    // legitimate clicks being throttled by register/login traffic.
    Route::get('auth/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
        ->middleware('throttle:10,1')
        ->name('verification.verify');

    Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
        // Auth routes (protected) — accessible even when suspended
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::post('auth/create-handoff-token', [AuthController::class, 'createHandoffToken'])
            ->middleware('throttle:10,1');
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::post('auth/email/resend', [EmailVerificationController::class, 'resend'])
            ->middleware('throttle:resend');

        // RGPD — Account management (accessible even when suspended)
        Route::prefix('account')->controller(AccountController::class)->group(function () {
            Route::get('data-export', 'exportData')->middleware('throttle:3,1');
            Route::prefix('consents')->group(function () {
                Route::get('/', 'consents');
                Route::post('revoke', 'revokeConsent');
                Route::post('grant', 'grantConsent');
            });
            Route::post('reactivate', 'reactivateAccount');
            Route::post('suspend', 'suspendAccount');
            Route::delete('/', 'deleteAccount');
        });

        // All routes below require a verified email and an active (non-suspended) account
        Route::middleware(['verified', 'not-suspended'])->group(function () {
            // Custom routes BEFORE apiResource to avoid {application} param conflict
            Route::get('applications/timeline', [ApplicationController::class, 'timeline'])
                ->name('applications.timeline');
            Route::get('applications/stats', [ApplicationController::class, 'stats'])
                ->name('applications.stats');
            Route::patch('applications/{application}/status', [ApplicationController::class, 'updateStatus'])
                ->name('applications.update-status');

            Route::apiResource('applications', ApplicationController::class);
        });
    });
});
