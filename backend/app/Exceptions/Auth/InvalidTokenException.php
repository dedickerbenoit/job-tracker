<?php

namespace App\Exceptions\Auth;

use Symfony\Component\HttpKernel\Exception\HttpException;

class InvalidTokenException extends HttpException
{
    public function __construct(string $message = 'Token invalide ou expiré', int $statusCode = 401)
    {
        parent::__construct($statusCode, $message);
    }
}
