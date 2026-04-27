<?php

return [

    'paths' => ['api/*', 'sanctum/*'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],

    'allowed_origins' => explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:5173')),

    'allowed_origins_patterns' => explode(',', env(
        'CORS_ALLOWED_ORIGIN_PATTERNS',
        // Allow all domains for LinkedIn, Indeed and HelloWork
        '^https:\/\/([a-z0-9-]+\.)*linkedin\.com$,^https:\/\/([a-z0-9-]+\.)*indeed\.(com|fr|co\.[a-z]{2,})$,^https:\/\/([a-z0-9-]+\.)*hellowork\.com$'
    )),

    'allowed_headers' => ['Content-Type', 'Authorization', 'Accept', 'X-Request-Token', 'X-XSRF-TOKEN'],

    'exposed_headers' => [],

    'max_age' => 3600,

    'supports_credentials' => true,

];
