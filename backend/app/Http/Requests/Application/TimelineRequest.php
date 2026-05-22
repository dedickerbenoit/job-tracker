<?php

namespace App\Http\Requests\Application;

use Illuminate\Foundation\Http\FormRequest;

class TimelineRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        $rules = [
            'application_id' => ['nullable', 'integer'],
            'type' => ['nullable', 'string'],
            'from_date' => ['nullable', 'date', 'date_format:Y-m-d'],
            'to_date' => ['nullable', 'date', 'date_format:Y-m-d'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];

        if ($this->filled('from_date')) {
            $rules['to_date'][] = 'after_or_equal:from_date';
        }

        return $rules;
    }
}
