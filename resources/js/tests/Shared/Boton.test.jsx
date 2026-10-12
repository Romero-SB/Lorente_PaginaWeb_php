import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Boton from '../../Components/Shared/Boton';

describe('Boton', () => {
    test('aplica la variante primario y muestra el contenido', () => {
        render(<Boton variante="primario">Guardar</Boton>);
        const boton = screen.getByRole('button', { name: 'Guardar' });
        expect(boton.className).toContain('panel-boton--primario');
    });

    test('invoca onClick al ser pulsado', async () => {
        const onClick = vi.fn();
        render(<Boton onClick={onClick}>Aceptar</Boton>);
        await userEvent.click(screen.getByRole('button', { name: 'Aceptar' }));
        expect(onClick).toHaveBeenCalledTimes(1);
    });
});