<?php

use Illuminate\Support\Facades\Route;

// SPA catch-all: serves the React frontend for all non-API routes.
// Routes under /api/* and /sanctum/* are declared in their own route files
// and take priority over this catch-all.
Route::get('/{any?}', fn () => view('spa'))->where('any', '.*');
