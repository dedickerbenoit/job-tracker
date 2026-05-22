<?php

namespace App\Observers;

use App\Enums\ApplicationEventType;
use App\Enums\ApplicationStatus;
use App\Models\Application;
use App\Models\ApplicationEvent;

class ApplicationObserver
{
    public function created(Application $application): void
    {
        ApplicationEvent::create([
            'user_id' => $application->user_id,
            'application_id' => $application->id,
            'type' => ApplicationEventType::Created,
            'description' => "Candidature créée pour {$application->title} chez {$application->company}",
            'metadata' => ['source' => $application->source->value],
        ]);
    }

    public function updated(Application $application): void
    {
        $changes = $application->getDirty();
        $original = $application->getOriginal();

        if ($application->isDirty('status')) {
            $oldEnum = $original['status'] instanceof ApplicationStatus ? $original['status'] : ApplicationStatus::from($original['status']);
            $newEnum = $changes['status'] instanceof ApplicationStatus ? $changes['status'] : ApplicationStatus::from($changes['status']);

            ApplicationEvent::create([
                'user_id' => $application->user_id,
                'application_id' => $application->id,
                'type' => ApplicationEventType::StatusChanged,
                'description' => "Statut modifié de '{$oldEnum->label()}' à '{$newEnum->label()}'",
                'metadata' => [
                    'old_status' => $oldEnum->value,
                    'new_status' => $newEnum->value,
                ],
            ]);
        }

        $excludeFields = ['updated_at', 'status_changed_at'];
        if ($application->isDirty('status')) {
            $excludeFields[] = 'status';
            $excludeFields[] = 'applied_at';
        }
        $otherChanges = collect($changes)->except($excludeFields)->keys()->toArray();
        if (! empty($otherChanges)) {
            $translatedFields = array_map(fn ($f) => __("fields.{$f}", [], 'fr'), $otherChanges);

            ApplicationEvent::create([
                'user_id' => $application->user_id,
                'application_id' => $application->id,
                'type' => ApplicationEventType::Updated,
                'description' => 'Informations mises à jour : '.implode(', ', $translatedFields),
                'metadata' => ['changed_fields' => $otherChanges],
            ]);
        }
    }

    public function deleted(Application $application): void
    {
        ApplicationEvent::create([
            'user_id' => $application->user_id,
            'application_id' => null,
            'type' => ApplicationEventType::Deleted,
            'description' => "Candidature supprimée : {$application->title} chez {$application->company}",
            'metadata' => [
                'title' => $application->title,
                'company' => $application->company,
                'status' => $application->status->value,
            ],
        ]);
    }
}
