<?php

namespace App\Http\Requests;

use App\Enums\ApplicationSource;
use App\Enums\ApplicationStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'company' => ['sometimes', 'required', 'string', 'max:255'],
            'location' => ['sometimes', 'required', 'string', 'max:255'],
            'url' => ['sometimes', 'required', 'url', 'max:2048'],
            'description' => ['nullable', 'string'],
            'source' => ['sometimes', 'required', Rule::enum(ApplicationSource::class)],
            'status' => ['sometimes', Rule::enum(ApplicationStatus::class)],
            'notes' => ['nullable', 'string'],
            'applied_at' => ['nullable', 'date'],
        ];
    }
}
