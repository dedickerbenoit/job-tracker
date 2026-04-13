<?php

namespace App\Enums;

enum ApplicationStatus: string
{
    case ToApply = 'to_apply';
    case Applied = 'applied';
    case FollowUp = 'follow_up';
    case Interview = 'interview';
    case Offer = 'offer';
    case Rejected = 'rejected';

    public function label(): string
    {
        return match ($this) {
            self::ToApply => 'À postuler',
            self::Applied => 'Postulé',
            self::FollowUp => 'Relance',
            self::Interview => 'Entretien',
            self::Offer => 'Offre reçue',
            self::Rejected => 'Refusé',
        };
    }
}
