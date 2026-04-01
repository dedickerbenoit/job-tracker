<?php

namespace App\Enums;

enum ApplicationEventType: string
{
    case Created = 'created';
    case StatusChanged = 'status_changed';
    case Updated = 'updated';
    case Deleted = 'deleted';
}
