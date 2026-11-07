import { render } from '@testing-library/react';

import { useBloqueoFondo } from '../../hooks/useBloqueoFondo';

function Bloqueo({ activo = true, selectores = [] }) {
    useBloqueoFondo(activo, selectores);
    return null;
}

function prepararFondo() {
    document.body.innerHTML = `
        <div class="sitio-root"></div>
        <div class="panel-capa"><div class="panel-ventana"></div></div>
    `;
    document.body.style.overflow = 'scroll';
    document.body.style.paddingRight = '5px';
}

afterEach(() => {
    document.body.innerHTML = '';
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    document.body.className = '';
});

describe('useBloqueoFondo', () => {
    test('marca el fondo como inerte y bloquea el scroll mientras está activo', () => {
        prepararFondo();
        const sitio = document.querySelector('.sitio-root');

        const { unmount } = render(<Bloqueo selectores={['.sitio-root']} />);

        expect(sitio).toHaveAttribute('inert');
        expect(document.body).toHaveClass('fondo-bloqueado');
        expect(document.body.style.overflow).toBe('hidden');

        unmount();

        expect(sitio).not.toHaveAttribute('inert');
        expect(document.body).not.toHaveClass('fondo-bloqueado');
        expect(document.body.style.overflow).toBe('scroll');
        expect(document.body.style.paddingRight).toBe('5px');
    });

    test('conserva el bloqueo mientras haya otro consumidor activo', () => {
        prepararFondo();
        const sitio = document.querySelector('.sitio-root');
        const panel = document.querySelector('.panel-ventana');

        const primero = render(<Bloqueo selectores={['.sitio-root']} />);
        const segundo = render(<Bloqueo selectores={['.panel-ventana']} />);

        expect(sitio).toHaveAttribute('inert');
        expect(panel).toHaveAttribute('inert');

        primero.unmount();

        expect(sitio).not.toHaveAttribute('inert');
        expect(panel).toHaveAttribute('inert');
        expect(document.body).toHaveClass('fondo-bloqueado');
        expect(document.body.style.overflow).toBe('hidden');

        segundo.unmount();

        expect(panel).not.toHaveAttribute('inert');
        expect(document.body).not.toHaveClass('fondo-bloqueado');
        expect(document.body.style.overflow).toBe('scroll');
    });

    test('no modifica el fondo cuando está inactivo', () => {
        prepararFondo();
        const sitio = document.querySelector('.sitio-root');

        render(<Bloqueo activo={false} selectores={['.sitio-root']} />);

        expect(sitio).not.toHaveAttribute('inert');
        expect(document.body).not.toHaveClass('fondo-bloqueado');
        expect(document.body.style.overflow).toBe('scroll');
    });
});
