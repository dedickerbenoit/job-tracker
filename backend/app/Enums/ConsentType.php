<?php

namespace App\Enums;

enum ConsentType: string
{
    case Terms = 'terms';
    case Privacy = 'privacy';

    /**
     * @return list<self>
     */
    public static function requiredForActivation(): array
    {
        return [self::Terms, self::Privacy];
    }
}
