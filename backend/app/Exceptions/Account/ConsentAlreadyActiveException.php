<?php

namespace App\Exceptions\Account;

use Symfony\Component\HttpKernel\Exception\HttpException;

class ConsentAlreadyActiveException extends HttpException
{
    public function __construct()
    {
        parent::__construct(409, 'Un consentement actif existe déjà pour ce type.');
    }
}
