import { render, screen } from '@testing-library/react';

import Campo from '../../Components/Shared/Campo';

describe('Campo', () => {
    test('asocia la etiqueta al control mediante id', () => {
        render(
            <Campo etiqueta="Nombre" id="c-nombre">
                <input id="c-nombre" />
            </Campo>,
        );
        expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
    });

    test('muestra el error con role alert', () => {
        render(
            <Campo error="Campo requerido">
                <input />
            </Campo>,
        );
        expect(screen.getByRole('alert')).toHaveTextContent('Campo requerido');
    });

    test('omite etiqueta y error cuando no se pasan', () => {
        render(<Campo><input /></Campo>);
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
});