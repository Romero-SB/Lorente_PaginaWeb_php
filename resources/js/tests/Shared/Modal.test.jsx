import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Modal from '../../Components/Shared/Modal';

describe('Modal', () => {
    test('abre un diálogo accesible con su contenido', () => {
        render(
            <Modal onCerrar={vi.fn()} ariaLabel="Confirmar">
                Contenido del diálogo
            </Modal>,
        );
        expect(screen.getByRole('dialog', { name: 'Confirmar' })).toBeInTheDocument();
        expect(screen.getByText('Contenido del diálogo')).toBeInTheDocument();
    });

    test('cierra al pulsar Escape', async () => {
        const onCerrar = vi.fn();
        render(<Modal onCerrar={onCerrar}>Contenido</Modal>);
        await userEvent.keyboard('{Escape}');
        expect(onCerrar).toHaveBeenCalledTimes(1);
    });

    test('cierra al pulsar el fondo', async () => {
        const onCerrar = vi.fn();
        render(<Modal onCerrar={onCerrar}>Contenido</Modal>);
        await userEvent.click(screen.getByRole('dialog', { name: 'Ventana' }).parentElement);
        expect(onCerrar).toHaveBeenCalledTimes(1);
    });

    test('bloquea el sitio y la ventana del panel cuando se abre dentro del panel', () => {
        document.body.innerHTML = `
            <div class="sitio-root"></div>
            <div class="panel-capa"><div class="panel-ventana"></div></div>
        `;
        document.body.style.overflow = 'scroll';
        document.body.style.paddingRight = '7px';

        const sitio = document.querySelector('.sitio-root');
        const panel = document.querySelector('.panel-ventana');

        const { unmount } = render(
            <Modal onCerrar={vi.fn()} ariaLabel="Formulario">
                Contenido
            </Modal>,
        );

        expect(sitio).toHaveAttribute('inert');
        expect(panel).toHaveAttribute('inert');
        expect(document.body).toHaveClass('fondo-bloqueado');
        expect(document.body.style.overflow).toBe('hidden');

        unmount();

        expect(sitio).not.toHaveAttribute('inert');
        expect(panel).not.toHaveAttribute('inert');
        expect(document.body).not.toHaveClass('fondo-bloqueado');
        expect(document.body.style.overflow).toBe('scroll');
        expect(document.body.style.paddingRight).toBe('7px');

        document.body.innerHTML = '';
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    });
});