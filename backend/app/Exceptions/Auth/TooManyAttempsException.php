<?php

namespace App\Exceptions\Auth;

use Symfony\Component\HttpKernel\Exception\HttpException;

class TooManyAttempsException extends HttpException
{
    public function __construct(public readonly int $retryAfterSeconds)
    {
        parent::__construct(429, "Trop de tentatives de connexion, veuillez réessayer dans {$this->retryAfterSeconds} secondes.");
    }
}
