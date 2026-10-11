import { useCallback, useEffect, useRef, useState } from 'react';

const CLAVE = 'lorente_panel_ventana';

const MIN_ANCHO = 420;
const MIN_ALTO = 440;

function acotar(v, min, max) {
    return Math.min(Math.max(v, min), max);
}

function ajustarAlViewport(b) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const w = acotar(b.width, MIN_ANCHO, Math.min(vw * 0.94, 1280));
    const h = acotar(b.height, MIN_ALTO, vh * 0.9);
    return {
        left: acotar(b.left, 8, Math.max(8, vw - 100)),
        top: acotar(b.top, 6, Math.max(6, vh - 60)),
        width: w,
        height: h,
    };
}

function inicial() {
    try {
        const crudo = localStorage.getItem(CLAVE);
        if (crudo) {
            const b = JSON.parse(crudo);
            if (
                b &&
                typeof b.left === 'number' &&
                typeof b.top === 'number' &&
                typeof b.width === 'number' &&
                typeof b.height === 'number'
            ) {
                return ajustarAlViewport(b);
            }
        }
    } catch {}
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(1120, Math.round(vw * 0.92));
    const height = Math.min(780, Math.round(vh * 0.9));
    return {
        left: Math.max(8, Math.round((vw - width) / 2)),
        top: Math.max(6, Math.round((vh - height) / 2)),
        width,
        height,
    };
}

export function usePanelWindow() {
    const [view, setView] = useState('normal');
    const [bounds, setBounds] = useState(inicial);
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
    const panelRef = useRef(null);
    const dragRef = useRef({ active: false, startX: 0, startY: 0, startLeft: 0, startTop: 0 });
    const resizeRef = useRef({ active: false, dir: '', startX: 0, startY: 0, startRect: null });

    useEffect(() => {
        const onResize = () => {
            setIsMobile(window.innerWidth < 768);
            setBounds((b) => ajustarAlViewport(b));
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    useEffect(() => {
        if (view !== 'normal' || isMobile) return;
        const id = setTimeout(() => {
            try {
                localStorage.setItem(CLAVE, JSON.stringify(bounds));
            } catch {}
        }, 250);
        return () => clearTimeout(id);
    }, [bounds, view, isMobile]);

    const arrastrarInicio = useCallback(
        (clientX, clientY) => {
            if (isMobile || view !== 'normal') return;
            const rect = panelRef.current?.getBoundingClientRect();
            if (!rect) return;
            const d = dragRef.current;
            d.active = true;
            d.startX = clientX;
            d.startY = clientY;
            d.startLeft = rect.left;
            d.startTop = rect.top;

            const onMove = (e) => {
                if (!d.active) return;
                const cx = e.touches ? e.touches[0].clientX : e.clientX;
                const cy = e.touches ? e.touches[0].clientY : e.clientY;
                const dx = cx - d.startX;
                const dy = cy - d.startY;
                const cur = panelRef.current?.getBoundingClientRect();
                const pw = cur?.width || 480;
                const ph = cur?.height || 600;
                const left = acotar(d.startLeft + dx, -(pw - 100), window.innerWidth - 100);
                const top = acotar(d.startTop + dy, -30, window.innerHeight - 60);
                setBounds((prev) => ({ ...prev, left, top }));
            };

            const onEnd = () => {
                d.active = false;
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onEnd);
                window.removeEventListener('touchmove', onMove);
                window.removeEventListener('touchend', onEnd);
            };

            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onEnd);
            window.addEventListener('touchmove', onMove, { passive: false });
            window.addEventListener('touchend', onEnd);
        },
        [isMobile, view],
    );

    const redimensionarInicio = useCallback(
        (dir, clientX, clientY) => {
            if (isMobile || view !== 'normal') return;
            const rect = panelRef.current?.getBoundingClientRect();
            if (!rect) return;
            const d = resizeRef.current;
            d.active = true;
            d.dir = dir;
            d.startX = clientX;
            d.startY = clientY;
            d.startRect = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };

            const onMove = (e) => {
                if (!d.active) return;
                const cx = e.touches ? e.touches[0].clientX : e.clientX;
                const cy = e.touches ? e.touches[0].clientY : e.clientY;
                const dx = cx - d.startX;
                const dy = cy - d.startY;
                const s = d.startRect;
                const maxW = Math.min(window.innerWidth * 0.94, 1280);
                const maxH = window.innerHeight * 0.9;
                let w = s.width;
                let h = s.height;
                let top = s.top;
                let left = s.left;

                if (d.dir.includes('e')) w = acotar(s.width + dx, MIN_ANCHO, maxW);
                if (d.dir.includes('w')) {
                    w = acotar(s.width - dx, MIN_ANCHO, maxW);
                    left = s.left + s.width - w;
                }
                if (d.dir.includes('s')) h = acotar(s.height + dy, MIN_ALTO, maxH);
                if (d.dir.includes('n')) {
                    h = acotar(s.height - dy, MIN_ALTO, maxH);
                    top = s.top + s.height - h;
                }

                left = acotar(left, 0, window.innerWidth - 100);
                top = acotar(top, 0, window.innerHeight - 60);
                setBounds({ left, top, width: w, height: h });
            };

            const onEnd = () => {
                d.active = false;
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onEnd);
                window.removeEventListener('touchmove', onMove);
                window.removeEventListener('touchend', onEnd);
            };

            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onEnd);
            window.addEventListener('touchmove', onMove, { passive: false });
            window.addEventListener('touchend', onEnd);
        },
        [isMobile, view],
    );

    const claseVentana =
        view === 'maximizado'
            ? 'panel-ventana pv-max'
            : isMobile
              ? 'panel-ventana pv-movil'
              : 'panel-ventana';

    const estiloVentana =
        view === 'minimizado'
            ? { display: 'none' }
            : view === 'normal' && !isMobile
              ? { left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height }
              : {};

    return {
        panelRef,
        view,
        setView,
        isMobile,
        claseVentana,
        estiloVentana,
        arrastrarInicio,
        redimensionarInicio,
    };
}