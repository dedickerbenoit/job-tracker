<?php

namespace App\Exceptions\Auth;

use Symfony\Component\HttpKernel\Exception\HttpException;

class InvalidCredentialsException extends HttpException
{
    public function __construct()
    {
        parent::__construct(422, 'Identifiants invalides');
    }
}
