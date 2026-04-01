<?php

use App\Http\Controllers\ApplicationController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    // Custom routes BEFORE apiResource to avoid {application} param conflict
    Route::get('applications/timeline', [ApplicationController::class, 'timeline'])
        ->name('applications.timeline');
    Route::get('applications/stats', [ApplicationController::class, 'stats'])
        ->name('applications.stats');
    Route::patch('applications/{application}/status', [ApplicationController::class, 'updateStatus'])
        ->name('applications.update-status');

    Route::apiResource('applications', ApplicationController::class);
});
