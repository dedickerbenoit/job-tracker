<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'email', 'unique:users'],
            'password' => ['required', 'string', Password::min(8)
                ->letters()
                ->mixedCase()
                ->numbers()
                ->uncompromised(), 'confirmed'],
            'accept_terms' => ['required', 'accepted'],
            'accept_privacy' => ['required', 'accepted'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique' => __('validation.email'),
            'accept_terms.required' => 'Vous devez accepter les conditions générales d\'utilisation.',
            'accept_terms.accepted' => 'Vous devez accepter les conditions générales d\'utilisation.',
            'accept_privacy.required' => 'Vous devez accepter la politique de confidentialité.',
            'accept_privacy.accepted' => 'Vous devez accepter la politique de confidentialité.',
        ];
    }
}
