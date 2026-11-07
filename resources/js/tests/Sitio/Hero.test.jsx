import { render, screen } from '@testing-library/react';

import Hero from '../../Components/Sitio/Hero';

describe('Hero', () => {
    test('muestra el nivel en singular sin cambiar el valor configurado', () => {
        render(<Hero config={{ niveles: 'Secundaria' }} />);

        expect(screen.getByText('Secundaria')).toBeInTheDocument();
        expect(screen.getByText(/Nivel$/)).toBeInTheDocument();
        expect(screen.queryByText(/Niveles$/)).not.toBeInTheDocument();
    });

    test('usa 1846 como año de fundación por defecto', () => {
        render(<Hero config={{}} />);

        expect(screen.getByText('1846')).toBeInTheDocument();
    });
});
