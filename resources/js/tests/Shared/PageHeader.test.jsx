import { render, screen } from '@testing-library/react';

import PageHeader from '../../Components/Shared/PageHeader';

describe('PageHeader', () => {
    test('muestra título, descripción y acciones', () => {
        render(
            <PageHeader titulo="Cuentas" descripcion="Gestiona los usuarios">
                <button>Añadir</button>
            </PageHeader>,
        );
        expect(screen.getByRole('heading', { name: 'Cuentas' })).toBeInTheDocument();
        expect(screen.getByText('Gestiona los usuarios')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Añadir' })).toBeInTheDocument();
    });
});