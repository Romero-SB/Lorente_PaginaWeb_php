import { render, screen } from '@testing-library/react';

import EmptyState from '../../Components/Shared/EmptyState';

describe('EmptyState', () => {
    test('muestra el mensaje del estado vacío', () => {
        render(<EmptyState mensaje="No hay cuentas registradas." />);
        expect(screen.getByText('No hay cuentas registradas.')).toBeInTheDocument();
    });
});