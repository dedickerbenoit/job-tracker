<?php

namespace App\Observers;

use App\Enums\ApplicationEventType;
use App\Models\Application;
use App\Models\ApplicationEvent;

class ApplicationObserver
{
    public function created(Application $application): void
    {
        $event = new ApplicationEvent();
        $event->user_id = $application->user_id;
        $event->application_id = $application->id;
        $event->type = ApplicationEventType::Created;
        $event->description = "Candidature creee pour {$application->title} chez {$application->company}";
        $event->metadata = ['source' => $application->source->value];
        $event->save();
    }

    public function updated(Application $application): void
    {
        $changes = $application->getDirty();
        $original = $application->getOriginal();

        if ($application->isDirty('status')) {
            $event = new ApplicationEvent();
            $event->user_id = $application->user_id;
            $event->application_id = $application->id;
            $event->type = ApplicationEventType::StatusChanged;
            $oldStatus = $original['status'] instanceof \App\Enums\ApplicationStatus ? $original['status']->value : $original['status'];
            $newStatus = $changes['status'] instanceof \App\Enums\ApplicationStatus ? $changes['status']->value : $changes['status'];
            $event->description = "Statut change de '{$oldStatus}' a '{$newStatus}'";
            $event->metadata = [
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
            ];
            $event->save();
        }

        $excludeFields = ['updated_at'];
        if ($application->isDirty('status')) {
            $excludeFields[] = 'status';
            $excludeFields[] = 'applied_at';
        }
        $otherChanges = collect($changes)->except($excludeFields)->keys()->toArray();
        if (!empty($otherChanges)) {
            $event = new ApplicationEvent();
            $event->user_id = $application->user_id;
            $event->application_id = $application->id;
            $event->type = ApplicationEventType::Updated;
            $event->description = 'Informations mises a jour: ' . implode(', ', $otherChanges);
            $event->metadata = ['changed_fields' => $otherChanges];
            $event->save();
        }
    }

    public function deleted(Application $application): void
    {
        $event = new ApplicationEvent();
        $event->user_id = $application->user_id;
        $event->application_id = $application->id;
        $event->type = ApplicationEventType::Deleted;
        $event->description = "Candidature supprimee: {$application->title} chez {$application->company}";
        $event->metadata = [
            'title' => $application->title,
            'company' => $application->company,
            'status' => $application->status->value,
        ];
        $event->save();
    }
}
