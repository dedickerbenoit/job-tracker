<?php

namespace App\Http\Requests\Application;

use Illuminate\Foundation\Http\FormRequest;

class IndexApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        $rules = [
            'status' => ['nullable', 'string'],
            'source' => ['nullable', 'string'],
            'search' => ['nullable', 'string', 'max:255'],
            'from_date' => ['nullable', 'date', 'date_format:Y-m-d'],
            'to_date' => ['nullable', 'date', 'date_format:Y-m-d'],
            'sort' => ['nullable', 'string', 'in:created_at,updated_at,company,status,title'],
            'direction' => ['nullable', 'string', 'in:asc,desc'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];

        if ($this->filled('from_date')) {
            $rules['to_date'][] = 'after_or_equal:from_date';
        }

        return $rules;
    }
}
