<?php

namespace App\Enums;

enum ApplicationSource: string
{
    case LinkedIn = 'linkedin';
    case Indeed = 'indeed';
    case HelloWork = 'hellowork';
    case Manual = 'manual';
}
