<?php

namespace App\Http\Requests;

use App\Enums\ApplicationSource;
use App\Enums\ApplicationStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'company' => ['required', 'string', 'max:255'],
            'location' => ['required', 'string', 'max:255'],
            'url' => ['required', 'url', 'max:2048'],
            'description' => ['nullable', 'string', 'max:50000'],
            'source' => ['required', Rule::enum(ApplicationSource::class)],
            'status' => ['sometimes', Rule::enum(ApplicationStatus::class)],
            'notes' => ['nullable', 'string', 'max:10000'],
            'applied_at' => ['nullable', 'date'],
        ];
    }
}
