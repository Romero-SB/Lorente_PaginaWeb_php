import { usePage } from '@inertiajs/react';

/**
 * Errores de validación compartidos por Inertia (`usePage().props.errors`).
 *
 * Útil en componentes que no usan `useForm` (por ejemplo formularios con
 * inputs no controlados o errores globales de validación).
 *
 * @returns {{ errors: Record<string, string>, tieneErrores: () => boolean, errorDe: (campo: string) => string | undefined }}
 */
export function useFormErrors() {
    const { errors = {} } = usePage().props;

    return {
        errors,
        tieneErrores: () => Object.keys(errors).length > 0,
        errorDe: (campo) => errors[campo],
    };
}