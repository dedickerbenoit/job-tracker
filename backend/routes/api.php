<?php

use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

// Auth routes (public, rate-limited)
Route::middleware('throttle:5,1')->group(function () {
    Route::post('auth/register', [AuthController::class, 'register']);
    Route::post('auth/login', [AuthController::class, 'login']);
});

Route::middleware('auth:sanctum')->group(function () {
    // Auth routes (protected)
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('auth/me', [AuthController::class, 'me']);

    // Custom routes BEFORE apiResource to avoid {application} param conflict
    Route::get('applications/timeline', [ApplicationController::class, 'timeline'])
        ->name('applications.timeline');
    Route::get('applications/stats', [ApplicationController::class, 'stats'])
        ->name('applications.stats');
    Route::patch('applications/{application}/status', [ApplicationController::class, 'updateStatus'])
        ->name('applications.update-status');

    Route::apiResource('applications', ApplicationController::class);
});
