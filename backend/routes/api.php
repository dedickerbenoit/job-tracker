<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

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

Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
    // Auth routes (protected)
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::post('auth/create-handoff-token', [AuthController::class, 'createHandoffToken'])
        ->middleware('throttle:10,1');
    Route::get('auth/me', [AuthController::class, 'me']);

    // Custom routes BEFORE apiResource to avoid {application} param conflict
    Route::get('applications/timeline', [ApplicationController::class, 'timeline'])
        ->name('applications.timeline');
    Route::get('applications/stats', [ApplicationController::class, 'stats'])
        ->name('applications.stats');
    Route::patch('applications/{application}/status', [ApplicationController::class, 'updateStatus'])
        ->name('applications.update-status');

    Route::apiResource('applications', ApplicationController::class);

    // RGPD — Account management
    Route::get('account/data-export', [AccountController::class, 'exportData'])
        ->middleware('throttle:3,1');
    Route::delete('account', [AccountController::class, 'deleteAccount']);
});
