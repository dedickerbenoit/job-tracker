<?php

namespace App\Observers;

use App\Enums\ApplicationEventType;
use App\Enums\ApplicationStatus;
use App\Models\Application;
use App\Models\ApplicationEvent;

class ApplicationObserver
{
    private const FIELD_LABELS = [
        'title' => 'Intitulé',
        'company' => 'Entreprise',
        'location' => 'Localisation',
        'url' => 'URL',
        'description' => 'Description',
        'source' => 'Source',
        'notes' => 'Notes',
        'applied_at' => 'Date de candidature',
        'salary_min' => 'Salaire min',
        'salary_max' => 'Salaire max',
    ];

    public function created(Application $application): void
    {
        $event = new ApplicationEvent;
        $event->user_id = $application->user_id;
        $event->application_id = $application->id;
        $event->type = ApplicationEventType::Created;
        $event->description = "Candidature créée pour {$application->title} chez {$application->company}";
        $event->metadata = ['source' => $application->source->value];
        $event->save();
    }

    public function updated(Application $application): void
    {
        $changes = $application->getDirty();
        $original = $application->getOriginal();

        if ($application->isDirty('status')) {
            $event = new ApplicationEvent;
            $event->user_id = $application->user_id;
            $event->application_id = $application->id;
            $event->type = ApplicationEventType::StatusChanged;
            $oldEnum = $original['status'] instanceof ApplicationStatus ? $original['status'] : ApplicationStatus::from($original['status']);
            $newEnum = $changes['status'] instanceof ApplicationStatus ? $changes['status'] : ApplicationStatus::from($changes['status']);
            $event->description = "Statut modifié de '{$oldEnum->label()}' à '{$newEnum->label()}'";

            $oldStatus = $oldEnum->value;
            $newStatus = $newEnum->value;
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
        if (! empty($otherChanges)) {
            $event = new ApplicationEvent;
            $event->user_id = $application->user_id;
            $event->application_id = $application->id;
            $event->type = ApplicationEventType::Updated;
            $translatedFields = array_map(fn ($f) => self::FIELD_LABELS[$f] ?? $f, $otherChanges);
            $event->description = 'Informations mises à jour : '.implode(', ', $translatedFields);
            $event->metadata = ['changed_fields' => $otherChanges];
            $event->save();
        }
    }

    public function deleted(Application $application): void
    {
        $event = new ApplicationEvent;
        $event->user_id = $application->user_id;
        $event->application_id = null;
        $event->type = ApplicationEventType::Deleted;
        $event->description = "Candidature supprimée : {$application->title} chez {$application->company}";
        $event->metadata = [
            'title' => $application->title,
            'company' => $application->company,
            'status' => $application->status->value,
        ];
        $event->save();
    }
}
