import { render, screen } from '@testing-library/react';

import Configuracion from '../../Pages/Panel/Configuracion';

vi.mock('@inertiajs/react', () => ({
    router: { post: vi.fn(), visit: vi.fn() },
    usePage: () => ({ props: { auth: { user: null }, errors: {} } }),
    useForm: (datosIniciales) => ({
        data: datosIniciales,
        setData: vi.fn(),
        post: vi.fn(),
        reset: vi.fn(),
        clearErrors: vi.fn(),
        errors: {},
        processing: false,
    }),
}));

vi.mock('../../Components/Panel/EditorEstiloHito', () => ({ default: () => null }));
vi.mock('../../Components/Panel/Recortador', () => ({ default: () => null }));
vi.mock('../../Components/Shared/FileDropzone', () => ({ default: () => null }));

describe('Configuración', () => {
    test('mantiene el campo de niveles sin la ayuda redundante', () => {
        render(<Configuracion config={{ niveles: 'Inicial, Primaria' }} />);

        expect(screen.getByLabelText('Niveles')).toHaveValue('Inicial, Primaria');
        expect(screen.queryByText(/Separa los niveles con comas/i)).not.toBeInTheDocument();
    });
});
