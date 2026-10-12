import { renderHook } from '@testing-library/react';
import { usePage } from '@inertiajs/react';

import { useFormErrors } from '../../lib/useFormErrors';

vi.mock('@inertiajs/react', () => ({
    usePage: vi.fn(() => ({ props: { errors: { name: 'El nombre es obligatorio.' } } })),
}));

describe('useFormErrors', () => {
    test('expone los errores compartidos y sus utilidades', () => {
        const { result } = renderHook(() => useFormErrors());

        expect(result.current.errors).toEqual({ name: 'El nombre es obligatorio.' });
        expect(result.current.errorDe('name')).toBe('El nombre es obligatorio.');
        expect(result.current.tieneErrores()).toBe(true);
    });

    test('responde sin errores cuando no hay ninguno', () => {
        vi.mocked(usePage).mockReturnValue({ props: { errors: {} } });
        const { result } = renderHook(() => useFormErrors());

        expect(result.current.tieneErrores()).toBe(false);
        expect(result.current.errorDe('otro')).toBeUndefined();
    });
});