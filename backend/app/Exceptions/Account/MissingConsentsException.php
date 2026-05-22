<?php

namespace App\Exceptions\Account;

use Symfony\Component\HttpKernel\Exception\HttpException;

class MissingConsentsException extends HttpException
{
    public function __construct(public readonly array $missingConsents)
    {
        $types = implode(', ', $missingConsents);
        parent::__construct(422, "Consentements manquants : {$types}.");
    }
}
