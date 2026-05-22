<?php

namespace App\Exceptions\Account;

use Symfony\Component\HttpKernel\Exception\HttpException;

class ConsentNotFoundException extends HttpException
{
    public function __construct()
    {
        parent::__construct(404, 'Aucun consentement actif trouvé pour ce type.');
    }
}
