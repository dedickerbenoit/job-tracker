<?php

namespace App\Exceptions\Account;

use Symfony\Component\HttpKernel\Exception\HttpException;

class AccountNotSuspendedException extends HttpException
{
    public function __construct()
    {
        parent::__construct(409, "Le compte n'est pas suspendu");
    }
}
