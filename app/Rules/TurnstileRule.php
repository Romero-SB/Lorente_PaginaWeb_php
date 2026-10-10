<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Translation\PotentiallyTranslatedString;

class TurnstileRule implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  Closure(string, ?string=): PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! config('services.turnstile.enabled', true)) {
            return;
        }

        $secretKey = config('services.turnstile.secret_key');

        if (empty($secretKey)) {
            return;
        }

        if (empty($value) || ! is_string($value)) {
            $fail('Por favor, completa la verificación de seguridad.');

            return;
        }

        try {
            $http = Http::asForm();
            if (app()->environment('local')) {
                $http->withoutVerifying();
            }

            $response = $http->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
                'secret' => $secretKey,
                'response' => $value,
                'remoteip' => request()->ip(),
            ]);

            if (! $response->successful() || ! $response->json('success')) {
                Log::warning('Cloudflare Turnstile verification failed', [
                    'ip' => request()->ip(),
                    'error_codes' => $response->json('error-codes', []),
                ]);
                $fail('La verificación de seguridad ha fallado. Por favor, reinténtalo.');
            }
        } catch (\Throwable $e) {
            Log::error('Error de comunicación con Cloudflare Turnstile: '.$e->getMessage());

            if (app()->environment('local')) {
                Log::warning('Turnstile omitido en local por error de red/SSL: '.$e->getMessage());

                return;
            }

            $fail('No se pudo verificar la seguridad con Cloudflare. Inténtalo de nuevo.');
        }
    }
}
